<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';


requirePostRequest();


$data =
    getJsonBody();


$email =
    normalizeEmail(
        $data['email'] ?? ''
    );


$password =
    isset($data['password']) &&
    is_string($data['password'])
        ? $data['password']
        : '';


$resetToken =
    isset($data['reset_token']) &&
    is_string($data['reset_token'])
        ? trim(
            $data['reset_token']
        )
        : '';


// ======================================================
// EMAIL KONTROL
// ======================================================

if (
    !isValidEmail(
        $email
    )
) {
    jsonResponse(
        [
            'success' => false,
            'message' =>
                'Geçersiz şifre sıfırlama isteği.'
        ],
        400
    );
}


// ======================================================
// RESET TOKEN KONTROL
// ======================================================

if (
    !preg_match(
        '/^[a-f0-9]{64}$/i',
        $resetToken
    )
) {
    jsonResponse(
        [
            'success' => false,
            'message' =>
                'Şifre sıfırlama oturumu geçersiz veya süresi dolmuş.'
        ],
        400
    );
}


// ======================================================
// ŞİFRE KONTROLÜ
// ======================================================

[
    $passwordValid,
    $passwordMessage
] =
    validatePasswordPolicy(
        $password
    );


if (!$passwordValid) {

    jsonResponse(
        [
            'success' => false,
            'message' =>
                $passwordMessage
        ],
        400
    );
}


// ======================================================
// RATE LIMIT
// ======================================================

enforceRateLimit(
    $pdo,
    'password_reset_send_ip',
    getClientIp(),
    999,
    900
);

enforceRateLimit(
    $pdo,
    'password_reset_send_email',
    $email,
    999,
    900
);

enforceRateLimit(
    $pdo,
    'password_reset_send_cooldown',
    $email,
    999,
    60
);


try {

    // ==================================================
    // KULLANICI
    // ==================================================

    $stmt =
        $pdo->prepare(
            "
            SELECT
                id
            FROM users
            WHERE LOWER(email) = LOWER(?)
            LIMIT 1
            "
        );


    $stmt->execute(
        [
            $email
        ]
    );


    $user =
        $stmt->fetch();


    if (!$user) {

        jsonResponse(
            [
                'success' => false,
                'message' =>
                    'Şifre sıfırlama oturumu geçersiz veya süresi dolmuş.'
            ],
            400
        );
    }


    $userId =
        (int) $user['id'];


    // ==================================================
    // TOKEN HASH
    // ==================================================

    $tokenHash =
        hashResetToken(
            $resetToken
        );


    // ==================================================
    // RESET SESSION
    // ==================================================

    $stmt =
        $pdo->prepare(
            "
            SELECT
                id,
                expires_at,
                used
            FROM password_reset_sessions
            WHERE user_id = ?
              AND token_hash = ?
              AND used = 0
            LIMIT 1
            "
        );


    $stmt->execute(
        [
            $userId,
            $tokenHash
        ]
    );


    $session =
        $stmt->fetch();


    if (!$session) {

        jsonResponse(
            [
                'success' => false,
                'message' =>
                    'Şifre sıfırlama oturumu geçersiz veya süresi dolmuş.'
            ],
            400
        );
    }


    // ==================================================
    // TOKEN SÜRESİ
    // ==================================================

    $sessionExpiresAt =
        (int) $session['expires_at'];


    if (
        $sessionExpiresAt <= 0 ||
        $sessionExpiresAt < time()
    ) {

        $expire =
            $pdo->prepare(
                "
                UPDATE password_reset_sessions
                SET used = 1
                WHERE id = ?
                "
            );


        $expire->execute(
            [
                (int) $session['id']
            ]
        );


        jsonResponse(
            [
                'success' => false,
                'message' =>
                    'Şifre sıfırlama oturumunun süresi dolmuş. Lütfen yeniden kod isteyin.'
            ],
            400
        );
    }


    // ==================================================
    // ŞİFRE HASH
    // ==================================================

    $passwordHash =
        password_hash(
            $password,
            PASSWORD_BCRYPT,
            [
                'cost' => 12
            ]
        );


    if ($passwordHash === false) {

        jsonResponse(
            [
                'success' => false,
                'message' =>
                    'Yeni şifre oluşturulamadı.'
            ],
            500
        );
    }


    /*
     * Node.js bcrypt ile uyumluluk
     *
     * PHP genellikle $2y$ üretir.
     * Node bcrypt $2b$ ile sorunsuz çalışır.
     */
    if (
        str_starts_with(
            $passwordHash,
            '$2y$'
        )
    ) {

        $passwordHash =
            '$2b$' .
            substr(
                $passwordHash,
                4
            );
    }


    // ==================================================
    // ŞİFREYİ GÜNCELLE
    // ==================================================

    try {

        $pdo->beginTransaction();


        $updatePassword =
            $pdo->prepare(
                "
                UPDATE users
                SET password = ?
                WHERE id = ?
                "
            );


        $updatePassword->execute(
            [
                $passwordHash,
                $userId
            ]
        );


        if (
            $updatePassword->rowCount() < 1
        ) {

            throw new RuntimeException(
                'Kullanıcı şifresi güncellenemedi.'
            );
        }


        // Tüm reset sessionlarını kapat

        $closeSessions =
            $pdo->prepare(
                "
                UPDATE password_reset_sessions
                SET used = 1
                WHERE user_id = ?
                "
            );


        $closeSessions->execute(
            [
                $userId
            ]
        );


        // Eski doğrulama kodlarını kapat

        $closeCodes =
            $pdo->prepare(
                "
                UPDATE password_reset_codes
                SET used = 1
                WHERE user_id = ?
                "
            );


        $closeCodes->execute(
            [
                $userId
            ]
        );


        $pdo->commit();


    } catch (Throwable $dbError) {

        if (
            $pdo->inTransaction()
        ) {
            $pdo->rollBack();
        }


        error_log(
            'PASSWORD RESET UPDATE DB ERROR: ' .
            $dbError->getMessage()
        );


        jsonResponse(
            [
                'success' => false,
                'message' =>
                    'Şifre güncellenemedi.'
            ],
            500
        );
    }


    // ==================================================
    // BAŞARILI
    // ==================================================

    jsonResponse(
        [
            'success' => true,
            'message' =>
                'Şifreniz başarıyla güncellendi.'
        ],
        200
    );


} catch (Throwable $error) {

    if (
        $pdo->inTransaction()
    ) {
        $pdo->rollBack();
    }


    error_log(
        'PASSWORD RESET UPDATE ERROR: ' .
        $error->getMessage()
    );


    jsonResponse(
        [
            'success' => false,
            'message' =>
                'Şifre güncellenirken bir hata oluştu.'
        ],
        500
    );
}