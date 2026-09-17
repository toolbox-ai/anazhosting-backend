<?php

declare(strict_types=1);

date_default_timezone_set('Europe/Istanbul');

/*
|--------------------------------------------------------------------------
| GÜVENLİK HEADERLARI
|--------------------------------------------------------------------------
*/

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

$allowedOrigins = [
    'http://localhost:8000',
    'http://127.0.0.1:8000'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| .ENV OKUYUCU
|--------------------------------------------------------------------------
|
| backend/.env dosyasını okur.
|
*/

function loadEnvFile(string $filePath): void
{
    if (!is_file($filePath) || !is_readable($filePath)) {
        return;
    }

    $lines = file(
        $filePath,
        FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES
    );

    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);

        if ($line === '') {
            continue;
        }

        if (str_starts_with($line, '#')) {
            continue;
        }

        if (!str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);

        $key = trim($key);
        $value = trim($value);

        if ($key === '') {
            continue;
        }

        if (
            strlen($value) >= 2 &&
            (
                ($value[0] === '"' && $value[strlen($value) - 1] === '"') ||
                ($value[0] === "'" && $value[strlen($value) - 1] === "'")
            )
        ) {
            $value = substr($value, 1, -1);
        }

        /*
         * Sistemde zaten tanımlı bir environment variable varsa
         * .env ile üzerine yazmıyoruz.
         */
        if (getenv($key) === false) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
        }
    }
}

loadEnvFile(__DIR__ . '/backend/.env');

/*
|--------------------------------------------------------------------------
| ENV YARDIMCISI
|--------------------------------------------------------------------------
*/

function envValue(string $key, string $default = ''): string
{
    $value = getenv($key);

    if ($value === false) {
        return $default;
    }

    return trim((string) $value);
}

/*
|--------------------------------------------------------------------------
| SMTP
|--------------------------------------------------------------------------
*/

define(
    'SMTP_HOST',
    'smtp.gmail.com'
);

define(
    'SMTP_PORT',
    587
);

define(
    'SMTP_USERNAME',
    envValue('VORTEX_SMTP_USERNAME')
);

define(
    'SMTP_PASSWORD',
    str_replace(
        ' ',
        '',
        envValue('VORTEX_SMTP_PASSWORD')
    )
);

define(
    'SMTP_FROM_EMAIL',
    SMTP_USERNAME
);

define(
    'SMTP_FROM_NAME',
    'ANAZHOSTING'
);

/*
|--------------------------------------------------------------------------
| DOĞRULAMA KODU PEPPER
|--------------------------------------------------------------------------
*/

define(
    'AUTH_CODE_PEPPER',
    envValue('VORTEX_AUTH_CODE_PEPPER')
);

/*
|--------------------------------------------------------------------------
| SQLITE
|--------------------------------------------------------------------------
*/

$dbPath = __DIR__ . '/backend/vortex.db';

try {
    $pdo = new PDO(
        'sqlite:' . $dbPath,
        null,
        null,
        [
            PDO::ATTR_ERRMODE =>
                PDO::ERRMODE_EXCEPTION,

            PDO::ATTR_DEFAULT_FETCH_MODE =>
                PDO::FETCH_ASSOC,

            PDO::ATTR_EMULATE_PREPARES =>
                false
        ]
    );

    $pdo->exec(
        'PRAGMA busy_timeout = 5000'
    );

    $pdo->exec(
        'PRAGMA foreign_keys = ON'
    );

} catch (Throwable $e) {
    error_log(
        'SQLite bağlantı hatası: ' .
        $e->getMessage()
    );

    http_response_code(500);

    header(
        'Content-Type: application/json; charset=utf-8'
    );

    echo json_encode(
        [
            'success' => false,
            'message' => 'Sunucu veritabanına bağlanamadı.'
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| JSON RESPONSE
|--------------------------------------------------------------------------
*/

function jsonResponse(
    array $data,
    int $statusCode = 200
): never {
    http_response_code($statusCode);

    header(
        'Content-Type: application/json; charset=utf-8'
    );

    header(
        'Cache-Control: no-store, no-cache, must-revalidate, max-age=0'
    );

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| POST ZORUNLULUĞU
|--------------------------------------------------------------------------
*/

function requirePostRequest(): void
{
    if (
        ($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST'
    ) {
        jsonResponse(
            [
                'success' => false,
                'message' => 'Geçersiz istek.'
            ],
            405
        );
    }
}

/*
|--------------------------------------------------------------------------
| JSON BODY OKU
|--------------------------------------------------------------------------
*/

function getJsonBody(): array
{
    $contentType =
        strtolower(
            trim(
                $_SERVER['CONTENT_TYPE'] ?? ''
            )
        );

    if (
        strpos(
            $contentType,
            'application/json'
        ) !== 0
    ) {
        jsonResponse(
            [
                'success' => false,
                'message' => 'Geçersiz içerik türü.'
            ],
            415
        );
    }

    $contentLength =
        (int) (
            $_SERVER['CONTENT_LENGTH'] ?? 0
        );

    if ($contentLength > 16384) {
        jsonResponse(
            [
                'success' => false,
                'message' => 'İstek çok büyük.'
            ],
            413
        );
    }

    $raw =
        file_get_contents(
            'php://input'
        );

    if ($raw === false) {
        jsonResponse(
            [
                'success' => false,
                'message' => 'İstek okunamadı.'
            ],
            400
        );
    }

    if (strlen($raw) > 16384) {
        jsonResponse(
            [
                'success' => false,
                'message' => 'İstek çok büyük.'
            ],
            413
        );
    }

    try {
        $data = json_decode(
            $raw,
            true,
            32,
            JSON_THROW_ON_ERROR
        );

    } catch (Throwable $e) {
        jsonResponse(
            [
                'success' => false,
                'message' => 'Geçersiz JSON.'
            ],
            400
        );
    }

    if (!is_array($data)) {
        jsonResponse(
            [
                'success' => false,
                'message' => 'Geçersiz istek.'
            ],
            400
        );
    }

    return $data;
}

/*
|--------------------------------------------------------------------------
| EMAIL NORMALİZASYON
|--------------------------------------------------------------------------
*/

function normalizeEmail(
    mixed $email
): string {
    if (!is_string($email)) {
        return '';
    }

    return strtolower(
        trim($email)
    );
}

/*
|--------------------------------------------------------------------------
| EMAIL KONTROLÜ
|--------------------------------------------------------------------------
*/

function isValidEmail(
    string $email
): bool {
    if ($email === '') {
        return false;
    }

    if (strlen($email) > 254) {
        return false;
    }

    return filter_var(
        $email,
        FILTER_VALIDATE_EMAIL
    ) !== false;
}

/*
|--------------------------------------------------------------------------
| CLIENT IP
|--------------------------------------------------------------------------
|
| X-Forwarded-For'a güvenmiyoruz.
|
*/

function getClientIp(): string
{
    $ip =
        $_SERVER['REMOTE_ADDR'] ??
        'unknown';

    return substr(
        (string) $ip,
        0,
        64
    );
}

/*
|--------------------------------------------------------------------------
| 6 HANELİ KOD
|--------------------------------------------------------------------------
*/

function generateCode(): string
{
    return str_pad(
        (string) random_int(
            0,
            999999
        ),
        6,
        '0',
        STR_PAD_LEFT
    );
}

/*
|--------------------------------------------------------------------------
| KOD HASH
|--------------------------------------------------------------------------
*/

function hashCode(
    string $code
): string {
    requireAuthCodePepper();

    return hash_hmac(
        'sha256',
        $code,
        AUTH_CODE_PEPPER
    );
}

/*
|--------------------------------------------------------------------------
| RESET TOKEN
|--------------------------------------------------------------------------
*/

function generateResetToken(): string
{
    return bin2hex(
        random_bytes(32)
    );
}

/*
|--------------------------------------------------------------------------
| RESET TOKEN HASH
|--------------------------------------------------------------------------
*/

function hashResetToken(
    string $token
): string {
    return hash(
        'sha256',
        $token
    );
}

/*
|--------------------------------------------------------------------------
| SMTP CONFIG KONTROLÜ
|--------------------------------------------------------------------------
*/

function requireSmtpConfig(): void
{
    if (
        SMTP_USERNAME === '' ||
        SMTP_PASSWORD === ''
    ) {
        error_log(
            'SMTP ortam değişkenleri ayarlanmamış.'
        );

        jsonResponse(
            [
                'success' => false,
                'message' => 'E-posta servisi şu anda kullanılamıyor.'
            ],
            500
        );
    }
}

/*
|--------------------------------------------------------------------------
| PEPPER KONTROLÜ
|--------------------------------------------------------------------------
*/

function requireAuthCodePepper(): void
{
    if (
        AUTH_CODE_PEPPER === '' ||
        strlen(AUTH_CODE_PEPPER) < 32
    ) {
        error_log(
            'VORTEX_AUTH_CODE_PEPPER ayarlanmamış veya çok kısa.'
        );

        jsonResponse(
            [
                'success' => false,
                'message' => 'Sunucu güvenlik yapılandırması eksik.'
            ],
            500
        );
    }
}

/*
|--------------------------------------------------------------------------
| ŞİFRE POLİTİKASI
|--------------------------------------------------------------------------
*/

function validatePasswordPolicy(
    string $password
): array {
    if (strlen($password) < 8) {
        return [
            false,
            'Şifre en az 8 karakter olmalıdır.'
        ];
    }

    if (strlen($password) > 72) {
        return [
            false,
            'Şifre en fazla 72 karakter olabilir.'
        ];
    }

    if (
        !preg_match(
            '/[a-z]/',
            $password
        )
    ) {
        return [
            false,
            'Şifre en az bir küçük harf içermelidir.'
        ];
    }

    if (
        !preg_match(
            '/[A-Z]/',
            $password
        )
    ) {
        return [
            false,
            'Şifre en az bir büyük harf içermelidir.'
        ];
    }

    if (
        !preg_match(
            '/[0-9]/',
            $password
        )
    ) {
        return [
            false,
            'Şifre en az bir rakam içermelidir.'
        ];
    }

    return [
        true,
        ''
    ];
}

/*
|--------------------------------------------------------------------------
| RATE LIMIT TABLOSU
|--------------------------------------------------------------------------
*/

$pdo->exec(
    "
    CREATE TABLE IF NOT EXISTS security_rate_limits (
        bucket TEXT PRIMARY KEY,
        attempts INTEGER NOT NULL DEFAULT 0,
        window_started_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    )
    "
);

/*
|--------------------------------------------------------------------------
| RATE LIMIT
|--------------------------------------------------------------------------
*/

function enforceRateLimit(
    PDO $pdo,
    string $action,
    string $identity,
    int $maxAttempts,
    int $windowSeconds
): void {
    $now = time();

    $bucket = hash(
        'sha256',
        $action . '|' . $identity
    );

    $stmt = $pdo->prepare(
        "
        SELECT
            attempts,
            window_started_at
        FROM security_rate_limits
        WHERE bucket = ?
        LIMIT 1
        "
    );

    $stmt->execute(
        [$bucket]
    );

    $row = $stmt->fetch();

    if (!$row) {
        $insert =
            $pdo->prepare(
                "
                INSERT INTO security_rate_limits (
                    bucket,
                    attempts,
                    window_started_at,
                    updated_at
                )
                VALUES (?, 1, ?, ?)
                "
            );

        $insert->execute(
            [
                $bucket,
                $now,
                $now
            ]
        );

        return;
    }

    $windowStartedAt =
        (int) $row['window_started_at'];

    $attempts =
        (int) $row['attempts'];

    if (
        ($now - $windowStartedAt) >=
        $windowSeconds
    ) {
        $reset =
            $pdo->prepare(
                "
                UPDATE security_rate_limits
                SET
                    attempts = 1,
                    window_started_at = ?,
                    updated_at = ?
                WHERE bucket = ?
                "
            );

        $reset->execute(
            [
                $now,
                $now,
                $bucket
            ]
        );

        return;
    }

    if ($attempts >= $maxAttempts) {
        $retryAfter =
            $windowSeconds -
            ($now - $windowStartedAt);

        if ($retryAfter < 1) {
            $retryAfter = 1;
        }

        header(
            'Retry-After: ' .
            $retryAfter
        );

        jsonResponse(
            [
                'success' => false,
                'message' => 'Çok fazla deneme yaptınız. Lütfen biraz bekleyin.'
            ],
            429
        );
    }

    $update =
        $pdo->prepare(
            "
            UPDATE security_rate_limits
            SET
                attempts = attempts + 1,
                updated_at = ?
            WHERE bucket = ?
            "
        );

    $update->execute(
        [
            $now,
            $bucket
        ]
    );
}

/*
|--------------------------------------------------------------------------
| PASSWORD RESET TABLOSU
|--------------------------------------------------------------------------
*/

$pdo->exec(
    "
    CREATE TABLE IF NOT EXISTS password_reset_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        code TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        verified INTEGER NOT NULL DEFAULT 0,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
    )
    "
);

$pdo->exec(
    "
    CREATE INDEX IF NOT EXISTS
    idx_password_reset_codes_user
    ON password_reset_codes (
        user_id,
        used,
        expires_at
    )
    "
);

/*
|--------------------------------------------------------------------------
| PASSWORD RESET SESSION
|--------------------------------------------------------------------------
*/

$pdo->exec(
    "
    CREATE TABLE IF NOT EXISTS password_reset_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        used INTEGER NOT NULL DEFAULT 0,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
    )
    "
);

$pdo->exec(
    "
    CREATE INDEX IF NOT EXISTS
    idx_password_reset_sessions_user
    ON password_reset_sessions (
        user_id,
        used,
        expires_at
    )
    "
);

/*
|--------------------------------------------------------------------------
| EMAIL DOĞRULAMA TABLOSU
|--------------------------------------------------------------------------
*/

$pdo->exec(
    "
    CREATE TABLE IF NOT EXISTS email_verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        code TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
    )
    "
);

$pdo->exec(
    "
    CREATE INDEX IF NOT EXISTS
    idx_email_verification_codes_user
    ON email_verification_codes (
        user_id,
        used,
        expires_at
    )
    "
);

/*
|--------------------------------------------------------------------------
| ESKİ KAYITLARI ARA SIRA TEMİZLE
|--------------------------------------------------------------------------
*/

try {
    if (random_int(1, 100) <= 5) {
        $cleanupBefore =
            time() - 86400;

        $stmt =
            $pdo->prepare(
                "
                DELETE FROM security_rate_limits
                WHERE updated_at < ?
                "
            );

        $stmt->execute(
            [$cleanupBefore]
        );

        $stmt =
            $pdo->prepare(
                "
                DELETE FROM password_reset_codes
                WHERE expires_at < ?
                "
            );

        $stmt->execute(
            [$cleanupBefore]
        );

        $stmt =
            $pdo->prepare(
                "
                DELETE FROM password_reset_sessions
                WHERE expires_at < ?
                "
            );

        $stmt->execute(
            [$cleanupBefore]
        );

        $stmt =
            $pdo->prepare(
                "
                DELETE FROM email_verification_codes
                WHERE expires_at < ?
                "
            );

        $stmt->execute(
            [$cleanupBefore]
        );
    }

} catch (Throwable $e) {
    error_log(
        'Temizlik hatası: ' .
        $e->getMessage()
    );
}