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


$code =
    isset($data['code'])
        ? trim(
            (string) $data['code']
        )
        : '';


// ======================================================
// GİRİŞ KONTROLÜ
// ======================================================

if (
    !isValidEmail(
        $email
    ) ||
    !preg_match(
        '/^[0-9]{6}$/',
        $code
    )
) {
    jsonResponse(
        [
            'success' => false,
            'message' =>
                'Kod geçersiz veya süresi dolmuş.'
        ],
        400
    );
}


// ======================================================
// RATE LIMIT
// ======================================================

$ip =
    getClientIp();


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


requireAuthCodePepper();


try {

    // ==================================================
    // KULLANICI
    // ==================================================

    $stmt =
        $pdo->prepare(
            "
            SELECT id
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
                    'Kod geçersiz veya süresi dolmuş.'
            ],
            400
        );
    }


    $userId =
        (int) $user['id'];


    // ==================================================
    // SON KULLANILMAMIŞ KOD
    // ==================================================

    $stmt =
        $pdo->prepare(
            "
            SELECT
                id,
                code_hash,
                verified,
                used,
                expires_at
            FROM password_reset_codes
            WHERE user_id = ?
              AND used = 0
            ORDER BY id DESC
            LIMIT 1
            "
        );


    $stmt->execute(
        [
            $userId
        ]
    );


    $record =
        $stmt->fetch();


    if (!$record) {

        jsonResponse(
            [
                'success' => false,
                'message' =>
                    'Kod geçersiz veya süresi dolmuş.'
            ],
            400
        );
    }


    // ==================================================
    // SÜRE KONTROLÜ
    // ==================================================

    $expiresAt =
        strtotime(
            (string) $record['expires_at']
        );


    if (
        $expiresAt === false ||
        $expiresAt < time()
    ) {

        $expire =
            $pdo->prepare(
                "
                UPDATE password_reset_codes
                SET used = 1
                WHERE id = ?
                "
            );


        $expire->execute(
            [
                (int) $record['id']
            ]
        );


        jsonResponse(
            [
                'success' => false,
                'message' =>
                    'Kod geçersiz veya süresi dolmuş.'
            ],
            400
        );
    }


    // ==================================================
    // KOD HASH KONTROLÜ
    // ==================================================

    $submittedHash =
        hashCode(
            $code
        );


    if (
        !hash_equals(
            (string) $record['code_hash'],
            $submittedHash
        )
    ) {

        jsonResponse(
            [
                'success' => false,
                'message' =>
                    'Kod yanlış veya süresi dolmuş.'
            ],
            400
        );
    }


    // ==================================================
    // RESET TOKEN OLUŞTUR
    // ==================================================

    $resetToken =
        generateResetToken();


    $resetTokenHash =
        hashResetToken(
            $resetToken
        );


    $tokenExpiresAt =
        time() +
        (10 * 60);


    // ==================================================
    // TRANSACTION
    // ==================================================

    try {

        $pdo->beginTransaction();


        // Kullanılan kodu kapat

        $useCode =
            $pdo->prepare(
                "
                UPDATE password_reset_codes
                SET
                    verified = 1,
                    used = 1
                WHERE id = ?
                "
            );


        $useCode->execute(
            [
                (int) $record['id']
            ]
        );


        // Eski reset tokenlarını kapat

        $invalidateOldSessions =
            $pdo->prepare(
                "
                UPDATE password_reset_sessions
                SET used = 1
                WHERE user_id = ?
                  AND used = 0
                "
            );


        $invalidateOldSessions->execute(
            [
                $userId
            ]
        );


        // Yeni tek kullanımlık reset token

        $insertSession =
            $pdo->prepare(
                "
                INSERT INTO password_reset_sessions
                (
                    user_id,
                    token_hash,
                    used,
                    expires_at,
                    created_at
                )
                VALUES
                (
                    ?,
                    ?,
                    0,
                    ?,
                    ?
                )
                "
            );


        $insertSession->execute(
            [
                $userId,
                $resetTokenHash,
                $tokenExpiresAt,
                time()
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
            'PASSWORD RESET VERIFY DB ERROR: ' .
            $dbError->getMessage()
        );


        jsonResponse(
            [
                'success' => false,
                'message' =>
                    'Kod doğrulanırken bir hata oluştu.'
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
                'Kod başarıyla doğrulandı.',

            'reset_token' =>
                $resetToken
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
        'PASSWORD RESET VERIFY ERROR: ' .
        $error->getMessage()
    );


    jsonResponse(
        [
            'success' => false,
            'message' =>
                'Kod doğrulanamadı. Lütfen tekrar deneyin.'
        ],
        500
    );
}