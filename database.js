const Database = require("better-sqlite3");
const path = require("path");


// ======================================================
// VERİTABANI BAĞLANTISI
// ======================================================

const db = new Database(
    path.join(
        __dirname,
        "vortex.db"
    )
);


// ======================================================
// SQLITE AYARLARI
// ======================================================

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");


// ======================================================
// ANA TABLOLAR
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,

        email TEXT NOT NULL UNIQUE,

        password TEXT NOT NULL,

        role TEXT NOT NULL DEFAULT 'user',

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );


    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,

        type TEXT NOT NULL,

        name TEXT NOT NULL,

        price REAL NOT NULL DEFAULT 0,

        period TEXT,

        status TEXT NOT NULL DEFAULT 'Aktif',

        expiry_date TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(user_id)
            REFERENCES users(id)
    );


    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,

        total REAL NOT NULL DEFAULT 0,

        status TEXT NOT NULL DEFAULT 'Bekliyor',

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(user_id)
            REFERENCES users(id)
    );


    CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,

        service_name TEXT NOT NULL,

        amount REAL NOT NULL DEFAULT 0,

        type TEXT,

        status TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(user_id)
            REFERENCES users(id)
    );
`);


// ======================================================
// EKSİK SÜTUN EKLEME
// ======================================================

function addColumnIfMissing(
    table,
    column,
    definition
) {
    const columns =
        db.prepare(
            `PRAGMA table_info(${table})`
        )
        .all();

    const exists =
        columns.some(
            col =>
                col.name === column
        );

    if (!exists) {
        db.exec(
            `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
        );

        console.log(
            `${table}.${column} sütunu eklendi.`
        );
    }
}


// ======================================================
// KULLANICI E-POSTA DOĞRULAMA MIGRATION
// ======================================================

addColumnIfMissing(
    "users",
    "email_verified",
    "INTEGER NOT NULL DEFAULT 0"
);


// ======================================================
// FATURA MIGRATION
// ======================================================

addColumnIfMissing(
    "invoices",
    "invoice_no",
    "TEXT"
);

addColumnIfMissing(
    "invoices",
    "order_id",
    "INTEGER"
);

addColumnIfMissing(
    "invoices",
    "service_id",
    "INTEGER"
);

addColumnIfMissing(
    "invoices",
    "period",
    "TEXT"
);

addColumnIfMissing(
    "invoices",
    "subtotal",
    "REAL DEFAULT 0"
);

addColumnIfMissing(
    "invoices",
    "tax_rate",
    "REAL DEFAULT 20"
);

addColumnIfMissing(
    "invoices",
    "tax_amount",
    "REAL DEFAULT 0"
);

addColumnIfMissing(
    "invoices",
    "currency",
    "TEXT DEFAULT 'TRY'"
);


// ======================================================
// DNS KAYITLARI
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS dns_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,

        service_id INTEGER NOT NULL,

        domain TEXT NOT NULL,

        type TEXT NOT NULL,

        name TEXT NOT NULL,

        value TEXT NOT NULL,

        ttl INTEGER NOT NULL DEFAULT 3600,

        priority INTEGER,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(user_id)
            REFERENCES users(id),

        FOREIGN KEY(service_id)
            REFERENCES services(id)
    );


    CREATE TABLE IF NOT EXISTS nameservers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,

        service_id INTEGER NOT NULL UNIQUE,

        domain TEXT NOT NULL,

        ns1 TEXT NOT NULL DEFAULT 'ns1.anazhosting.com.tr',

        ns2 TEXT NOT NULL DEFAULT 'ns2.anazhosting.com.tr',

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(user_id)
            REFERENCES users(id),

        FOREIGN KEY(service_id)
            REFERENCES services(id)
    );
`);


// ======================================================
// SSL YÖNETİMİ
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS ssl_certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,

        service_id INTEGER NOT NULL UNIQUE,

        domain TEXT,

        status TEXT NOT NULL DEFAULT 'Bekliyor',

        provider TEXT DEFAULT 'ANAZHOSTING SSL',

        issued_at TEXT,

        expires_at TEXT,

        auto_renew INTEGER NOT NULL DEFAULT 1,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(user_id)
            REFERENCES users(id),

        FOREIGN KEY(service_id)
            REFERENCES services(id)
    );
`);


// ======================================================
// KURUMSAL MAIL YÖNETİMİ
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS mail_domains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,

        service_id INTEGER NOT NULL UNIQUE,

        domain TEXT,

        webmail_url TEXT
            DEFAULT 'https://webmail.anazhosting.com.tr',

        status TEXT NOT NULL DEFAULT 'Bekliyor',

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(user_id)
            REFERENCES users(id),

        FOREIGN KEY(service_id)
            REFERENCES services(id)
    );


    CREATE TABLE IF NOT EXISTS mailboxes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,

        service_id INTEGER NOT NULL,

        email TEXT NOT NULL,

        password_hash TEXT,

        quota_mb INTEGER NOT NULL DEFAULT 1024,

        status TEXT NOT NULL DEFAULT 'Aktif',

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(user_id)
            REFERENCES users(id),

        FOREIGN KEY(service_id)
            REFERENCES services(id),

        UNIQUE(service_id, email)
    );
`);


// ======================================================
// HİZMET İŞLEM KAYITLARI
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS service_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,

        service_id INTEGER NOT NULL,

        action TEXT NOT NULL,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(user_id)
            REFERENCES users(id),

        FOREIGN KEY(service_id)
            REFERENCES services(id)
    );
`);


// ======================================================
// HOSTING FTP HESAPLARI
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS ftp_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,

        service_id INTEGER NOT NULL,

        username TEXT NOT NULL,

        password_hash TEXT NOT NULL,

        directory TEXT NOT NULL DEFAULT '/public_html',

        quota_mb INTEGER NOT NULL DEFAULT 1024,

        status TEXT NOT NULL DEFAULT 'Aktif',

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(user_id)
            REFERENCES users(id),

        FOREIGN KEY(service_id)
            REFERENCES services(id),

        UNIQUE(service_id, username)
    );
`);


// ======================================================
// INDEXLER
// ======================================================

db.exec(`
    CREATE INDEX IF NOT EXISTS
        idx_services_user
    ON services(user_id);


    CREATE INDEX IF NOT EXISTS
        idx_orders_user
    ON orders(user_id);


    CREATE INDEX IF NOT EXISTS
        idx_invoices_user
    ON invoices(user_id);


    CREATE INDEX IF NOT EXISTS
        idx_dns_service
    ON dns_records(service_id);


    CREATE INDEX IF NOT EXISTS
        idx_logs_service
    ON service_logs(service_id);


    CREATE INDEX IF NOT EXISTS
        idx_mailboxes_service
    ON mailboxes(service_id);


    CREATE INDEX IF NOT EXISTS
        idx_ftp_service
    ON ftp_accounts(service_id);
`);


// ======================================================
// EXPORT
// ======================================================
// ======================================================
// HOSTING VERİTABANI YÖNETİMİ
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS hosting_databases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,

        service_id INTEGER NOT NULL,

        database_name TEXT NOT NULL,

        database_user TEXT NOT NULL,

        password_hash TEXT NOT NULL,

        status TEXT NOT NULL DEFAULT 'Aktif',

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(user_id)
            REFERENCES users(id),

        FOREIGN KEY(service_id)
            REFERENCES services(id),

        UNIQUE(service_id, database_name),

        UNIQUE(service_id, database_user)
    );


    CREATE INDEX IF NOT EXISTS
        idx_hosting_databases_service
    ON hosting_databases(service_id);
`);

module.exports = db;