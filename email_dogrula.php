<?php

require_once
    __DIR__
    . '/config.php';


requirePostRequest();


$data =
    getJsonBody();


$email =
    normalizeEmail(
        (string)
        ($data['email'] ?? '')
    );


$code =
    trim(
        (string)
        ($data['code'] ?? '')
    );


if (
    !isValidEmail(
        $email
    )
) {
    jsonResponse(
        [
            'success' => false,
            'message' => 'Geçerli bir e-posta adresi girin.'
        ],
        400
    );
}


if (
    !preg_match(
        '/^[0-9]{6}$/',
        $code
    )
) {
    jsonResponse(
        [
            'success' => false,
            'message' => 'Doğrulama kodu 6 haneli olmalıdır.'
        ],
        400
    );
}


// ======================================================
// BRUTE FORCE KORUMASI
// ======================================================

enforceRateLimit(
    $pdo,
    'email-verification-check-ip',
    getClientIp(),
    15,
    15 * 60
);


enforceRateLimit(
    $pdo,
    'email-verification-check-email',
    $email,
    5,
    15 * 60
);


try {

    $stmt =
        $pdo->prepare("
            SELECT
                id,
                email,
                email_verified
            FROM users
            WHERE LOWER(email) = ?
            LIMIT 1
        ");

    $stmt->execute([
        $email
    ]);


    $user =
        $stmt->fetch(
            PDO::FETCH_ASSOC
        );


    if (!$user) {
        jsonResponse(
            [
                'success' => false,
                'message' => 'Doğrulama kodu geçersiz veya süresi dolmuş.'
            ],
            400
        );
    }


    if (
        (int)
        $user['email_verified'] ===
        1
    ) {
        jsonResponse(
            [
                'success' => true,
                'message' => 'E-posta adresi zaten doğrulanmış.'
            ],
            200
        );
    }


    $stmt =
        $pdo->prepare("
            SELECT
                id,
                code,
                expires_at
            FROM email_verification_codes
            WHERE user_id = ?
              AND used = 0
            ORDER BY id DESC
            LIMIT 1
        ");

    $stmt->execute([
        $user['id']
    ]);


    $verification =
        $stmt->fetch(
            PDO::FETCH_ASSOC
        );


    if (!$verification) {
        jsonResponse(
            [
                'success' => false,
                'message' => 'Doğrulama kodu geçersiz veya süresi dolmuş.'
            ],
            400
        );
    }


    $expiresAt =
        (int)
        $verification['expires_at'];


    if (
        $expiresAt <= 0 ||
        $expiresAt < time()
    ) {

        $pdo->prepare("
            UPDATE email_verification_codes
            SET used = 1
            WHERE id = ?
        ")
        ->execute([
            $verification['id']
        ]);


        jsonResponse(
            [
                'success' => false,
                'message' => 'Doğrulama kodu geçersiz veya süresi dolmuş.'
            ],
            400
        );
    }


    if (
        !hash_equals(
            (string)
            $verification['code'],
            $code
        )
    ) {
        jsonResponse(
            [
                'success' => false,
                'message' => 'Doğrulama kodu geçersiz veya süresi dolmuş.'
            ],
            400
        );
    }


    $pdo->beginTransaction();


    $updateUser =
        $pdo->prepare("
            UPDATE users
            SET email_verified = 1
            WHERE id = ?
        ");


    $updateUser->execute([
        $user['id']
    ]);


    $pdo->prepare("
        UPDATE email_verification_codes
        SET used = 1
        WHERE user_id = ?
          AND used = 0
    ")
    ->execute([
        $user['id']
    ]);


    $pdo->commit();


    jsonResponse(
        [
            'success' => true,
            'message' => 'E-posta adresin başarıyla doğrulandı.'
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
        'EMAIL VERIFY ERROR: '
        . $error->getMessage()
    );


    jsonResponse(
        [
            'success' => false,
            'message' => 'E-posta doğrulanırken bir hata oluştu.'
        ],
        500
    );
}