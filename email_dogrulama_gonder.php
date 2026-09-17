<?php

require_once
    __DIR__
    . '/config.php';

require_once
    __DIR__
    . '/PHPMailer/Exception.php';

require_once
    __DIR__
    . '/PHPMailer/PHPMailer.php';

require_once
    __DIR__
    . '/PHPMailer/SMTP.php';


use PHPMailer\PHPMailer\PHPMailer;


requirePostRequest();


$data =
    getJsonBody();


$email =
    normalizeEmail(
        (string)
        ($data['email'] ?? '')
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


// ======================================================
// RATE LIMIT
// ======================================================

enforceRateLimit(
    $pdo,
    'email-verification-send-ip',
    getClientIp(),
    5,
    15 * 60
);


enforceRateLimit(
    $pdo,
    'email-verification-send-email',
    $email,
    3,
    15 * 60
);


enforceRateLimit(
    $pdo,
    'email-verification-cooldown',
    $email,
    1,
    60
);


try {

    $stmt =
        $pdo->prepare("
            SELECT
                id,
                name,
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


    // ==================================================
    // ENUMERATION KORUMASI
    // ==================================================

    if (!$user) {

        jsonResponse(
            [
                'success' => true,
                'message' => 'Doğrulama gerekiyorsa kod e-posta adresine gönderildi.'
            ],
            200
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
                'message' => 'E-posta adresi zaten doğrulanmış.',
                'alreadyVerified' => true
            ],
            200
        );
    }


    requireSmtpConfig();


    $code =
        generateCode();


    /*
     * Kod 15 dakika geçerli.
     * config.php içindeki tablo expires_at alanını
     * INTEGER olarak tuttuğu için Unix timestamp kullanıyoruz.
     */
    $expiresAt =
        time() +
        15 * 60;


    $createdAt =
        time();


    $pdo->beginTransaction();


    /*
     * Kullanıcının daha önce oluşturulmuş ve
     * kullanılmamış doğrulama kodlarını geçersiz yap.
     */
    $pdo->prepare("
        UPDATE email_verification_codes
        SET used = 1
        WHERE user_id = ?
          AND used = 0
    ")
    ->execute([
        $user['id']
    ]);


    /*
     * Yeni doğrulama kodunu kaydet.
     *
     * Mevcut config.php şemasında:
     * code TEXT
     * expires_at INTEGER
     * created_at INTEGER
     * kullanılıyor.
     */
    $insert =
        $pdo->prepare("
            INSERT INTO email_verification_codes
            (
                user_id,
                code,
                used,
                expires_at,
                created_at
            )
            VALUES (?, ?, 0, ?, ?)
        ");


    $insert->execute([
        $user['id'],
        $code,
        $expiresAt,
        $createdAt
    ]);


    $codeId =
        (int)
        $pdo->lastInsertId();


    $pdo->commit();


    // ==================================================
    // E-POSTA GÖNDER
    // ==================================================

    try {

        $mail =
            new PHPMailer(
                true
            );


        $mail->isSMTP();


        $mail->Host =
            SMTP_HOST;


        $mail->SMTPAuth =
            true;


        $mail->Username =
            SMTP_USERNAME;


        $mail->Password =
            SMTP_PASSWORD;


        $mail->SMTPSecure =
            PHPMailer::ENCRYPTION_STARTTLS;


        $mail->Port =
            SMTP_PORT;


        $mail->CharSet =
            'UTF-8';


        $mail->Timeout =
            15;


        $mail->setFrom(
            SMTP_FROM_EMAIL,
            SMTP_FROM_NAME
        );


        $mail->addAddress(
            $user['email'],
            $user['name'] ?? ''
        );


        $mail->isHTML(
            true
        );


        $safeName =
            htmlspecialchars(
                (string)
                ($user['name'] ?? ''),
                ENT_QUOTES,
                'UTF-8'
            );


        $safeCode =
            htmlspecialchars(
                $code,
                ENT_QUOTES,
                'UTF-8'
            );


        $mail->Subject =
            'ANAZHOSTING - E-posta Doğrulama';


        $mail->Body = "
            <div style=\"font-family:Arial,sans-serif;background:#f8fafc;padding:30px;\">
                <div style=\"max-width:520px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:30px;\">

                    <h2 style=\"color:#0f172a;\">
                        E-posta Doğrulama
                    </h2>

                    <p style=\"color:#475569;\">
                        Merhaba {$safeName},
                    </p>

                    <p style=\"color:#475569;\">
                        ANAZHOSTING hesabınızı doğrulamak için aşağıdaki kodu kullanın.
                    </p>

                    <div style=\"text-align:center;margin:25px 0;\">
                        <span style=\"font-size:32px;font-weight:bold;letter-spacing:8px;color:#0284c7;background:#f0f9ff;padding:16px 24px;border-radius:12px;\">
                            {$safeCode}
                        </span>
                    </div>

                    <p style=\"color:#64748b;font-size:14px;\">
                        Kod 15 dakika boyunca geçerlidir.
                    </p>

                    <p style=\"color:#94a3b8;font-size:12px;margin-top:25px;\">
                        Bu kodu siz istemediyseniz bu e-postayı dikkate almayabilirsiniz.
                    </p>

                </div>
            </div>
        ";


        $mail->AltBody =
            "ANAZHOSTING doğrulama kodunuz: {$code}. "
            . "Kod 15 dakika geçerlidir.";


        $mail->send();


    } catch (Throwable $mailError) {

        /*
         * Mail gönderilemediyse oluşturduğumuz
         * doğrulama kodunu kullanılamaz hale getir.
         */
        $pdo->prepare("
            UPDATE email_verification_codes
            SET used = 1
            WHERE id = ?
        ")
        ->execute([
            $codeId
        ]);


        throw $mailError;
    }


    jsonResponse(
        [
            'success' => true,
            'message' => 'Doğrulama kodu e-posta adresine gönderildi.'
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
        'EMAIL VERIFICATION SEND ERROR: '
        . $error->getMessage()
    );


    jsonResponse(
        [
            'success' => false,
            'message' => 'Doğrulama e-postası şu anda gönderilemedi.'
        ],
        500
    );
}