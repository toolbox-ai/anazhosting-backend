<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

require_once __DIR__ . '/PHPMailer/Exception.php';
require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;


requirePostRequest();

$data = getJsonBody();

$email =
    normalizeEmail(
        $data['email'] ?? ''
    );


if (!isValidEmail($email)) {
    jsonResponse(
        [
            'success' => false,
            'message' =>
                'Geçerli bir e-posta adresi girin.'
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
                id,
                name,
                email
            FROM users
            WHERE LOWER(email) = LOWER(?)
            LIMIT 1
            "
        );

    $stmt->execute(
        [$email]
    );

    $user =
        $stmt->fetch();


    // Hesap yoksa bile aynı cevap
    if (!$user) {

        jsonResponse(
            [
                'success' => true,
                'message' =>
                    'E-posta adresi kayıtlıysa doğrulama kodu gönderildi.'
            ]
        );
    }


    requireSmtpConfig();
    requireAuthCodePepper();


    $userId =
        (int) $user['id'];


    // ==================================================
    // KOD
    // ==================================================

    $code =
        generateCode();

    $codeHash =
        hashCode(
            $code
        );


    /*
     * Mevcut password_reset_codes tablon
     * expires_at alanını TEXT olarak kullanıyor.
     * kod_dogrula.php de strtotime() ile okuyor.
     */
    $expiresAt =
        date(
            'Y-m-d H:i:s',
            time() + 900
        );


    // ==================================================
    // DB
    // ==================================================

    try {

        $pdo->beginTransaction();


        $invalidateCodes =
            $pdo->prepare(
                "
                UPDATE password_reset_codes
                SET used = 1
                WHERE user_id = ?
                  AND used = 0
                "
            );

        $invalidateCodes->execute(
            [$userId]
        );


        $invalidateSessions =
            $pdo->prepare(
                "
                UPDATE password_reset_sessions
                SET used = 1
                WHERE user_id = ?
                  AND used = 0
                "
            );

        $invalidateSessions->execute(
            [$userId]
        );


        /*
         * ÖNEMLİ:
         * Mevcut DB tablon code_hash kullanıyor.
         */
        $insert =
            $pdo->prepare(
                "
                INSERT INTO password_reset_codes
                (
                    user_id,
                    code_hash,
                    verified,
                    used,
                    expires_at
                )
                VALUES
                (
                    ?,
                    ?,
                    0,
                    0,
                    ?
                )
                "
            );


        $insert->execute(
            [
                $userId,
                $codeHash,
                $expiresAt
            ]
        );


        $codeId =
            (int)
            $pdo->lastInsertId();


        $pdo->commit();


    } catch (Throwable $dbError) {

        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }


        error_log(
            'PASSWORD RESET DB ERROR: ' .
            $dbError->getMessage()
        );


        jsonResponse(
            [
                'success' => false,
                'message' =>
                    'Doğrulama kodu oluşturulamadı.'
            ],
            500
        );
    }


    // ==================================================
    // MAIL
    // ==================================================

    $mail =
        new PHPMailer(true);


    try {

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
            (string) $user['email'],
            (string) (
                $user['name'] ?? ''
            )
        );


        $mail->isHTML(true);


        $safeName =
            htmlspecialchars(
                (string) (
                    $user['name'] ??
                    'Kullanıcı'
                ),
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
            'Vortex Hosting - Şifre Sıfırlama';


        $mail->Body = "
            <div style=\"
                font-family:Arial,sans-serif;
                background:#f8fafc;
                padding:30px;
            \">

                <div style=\"
                    max-width:520px;
                    margin:auto;
                    background:#ffffff;
                    border:1px solid #e2e8f0;
                    border-radius:16px;
                    padding:30px;
                \">

                    <h2 style=\"color:#0f172a;\">
                        Şifre Sıfırlama
                    </h2>

                    <p style=\"color:#475569;\">
                        Merhaba {$safeName},
                    </p>

                    <p style=\"color:#475569;\">
                        Şifrenizi sıfırlamak için aşağıdaki
                        6 haneli kodu kullanın.
                    </p>

                    <div style=\"
                        text-align:center;
                        margin:30px 0;
                    \">

                        <span style=\"
                            display:inline-block;
                            font-size:32px;
                            font-weight:bold;
                            letter-spacing:8px;
                            color:#0284c7;
                            background:#f0f9ff;
                            padding:16px 24px;
                            border-radius:12px;
                        \">
                            {$safeCode}
                        </span>

                    </div>

                    <p style=\"
                        color:#64748b;
                        font-size:14px;
                    \">
                        Bu kod 15 dakika boyunca geçerlidir.
                    </p>

                    <p style=\"
                        color:#64748b;
                        font-size:14px;
                    \">
                        Bu işlemi siz yapmadıysanız bu e-postayı
                        yok sayabilirsiniz.
                    </p>

                </div>

            </div>
        ";


        $mail->AltBody =
            "Vortex Hosting şifre sıfırlama kodunuz: {$code}. " .
            "Kod 15 dakika geçerlidir.";


        $mail->send();


    } catch (Throwable $mailError) {

        error_log(
            'PASSWORD RESET MAIL ERROR: ' .
            $mailError->getMessage()
        );


        try {

            $disable =
                $pdo->prepare(
                    "
                    UPDATE password_reset_codes
                    SET used = 1
                    WHERE id = ?
                    "
                );

            $disable->execute(
                [$codeId]
            );

        } catch (Throwable $ignored) {
        }


        jsonResponse(
            [
                'success' => false,
                'message' =>
                    'E-posta gönderilemedi. Lütfen biraz sonra tekrar deneyin.'
            ],
            500
        );
    }


    jsonResponse(
        [
            'success' => true,
            'message' =>
                'E-posta adresi kayıtlıysa doğrulama kodu gönderildi.'
        ]
    );


} catch (Throwable $error) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }


    error_log(
        'PASSWORD RESET SEND ERROR: ' .
        $error->getMessage()
    );


    jsonResponse(
        [
            'success' => false,
            'message' =>
                'İşlem şu anda tamamlanamadı. Lütfen biraz sonra tekrar deneyin.'
        ],
        500
    );
}