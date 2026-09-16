const {
    normalizeFullDomain,
    isDomainLocallyTaken,
    checkLocalDomain,
    searchDomains
} = require("./registrar");
require("dotenv").config();
const db = require("./database");
const {
    isWhmConfigured,
    testWhmConnection,
    createCpanelAccount,
    suspendCpanelAccount,
    unsuspendCpanelAccount,
    removeCpanelAccount,
    getCpanelAccount
} = require("./whm");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const PORT = Number(process.env.PORT || 3000);
const rateLimit =
    require("express-rate-limit");

const helmet =
    require("helmet");
const JWT_SECRET =
    String(
        process.env.JWT_SECRET || ""
    ).trim();

if (
    JWT_SECRET.length < 32
) {
    console.error(
        "JWT_SECRET .env içinde en az 32 karakter olmalıdır."
    );

    process.exit(1);
}

app.use(
    helmet({
        crossOriginResourcePolicy: false
    })
);

app.use(
    express.json({
        limit: "200kb"
    })
);
// ======================================================
// GÜVENLİK - RATE LIMIT
// ======================================================

const apiLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        limit:
            300,

        standardHeaders:
            "draft-7",

        legacyHeaders:
            false,

        message: {
            success:
                false,

            message:
                "Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin."
        }
    });


const authLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        limit:
            10,

        standardHeaders:
            "draft-7",

        legacyHeaders:
            false,

        skipSuccessfulRequests:
            true,

        message: {
            success:
                false,

            message:
                "Çok fazla giriş denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin."
        }
    });




    const loginAccountLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        limit:
            5,

        standardHeaders:
            "draft-7",

        legacyHeaders:
            false,

        keyGenerator:
            (req) => {

                const email =
                    normalizeEmail(
                        req.body?.email
                    );

                return crypto
                    .createHash("sha256")
                    .update(
                        email ||
                        String(req.ip)
                    )
                    .digest("hex");
            },

        skipSuccessfulRequests:
            true,

        requestWasSuccessful:
            (req, res) => {

                if (
                    res.statusCode >= 200 &&
                    res.statusCode < 400
                ) {
                    return true;
                }

                if (
                    res.locals
                        ?.loginPasswordCorrect ===
                    true
                ) {
                    return true;
                }

                return false;
            },

        message: {
            success: false,
            message:
                "Bu hesap için çok fazla başarısız giriş denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin."
        }
    });
const registerLimiter =
    rateLimit({
        windowMs:
            60 * 60 * 1000,

        limit:
            5,

        standardHeaders:
            "draft-7",

        legacyHeaders:
            false,

        message: {
            success:
                false,

            message:
                "Çok fazla kayıt denemesi yapıldı. Lütfen daha sonra tekrar deneyin."
        }
    });


app.use(
    "/api",
    apiLimiter
);

app.disable(
    "x-powered-by"
);

app.use(
    (req, res, next) => {

        res.setHeader(
            "X-Content-Type-Options",
            "nosniff"
        );

        res.setHeader(
            "Referrer-Policy",
            "strict-origin-when-cross-origin"
        );

        res.setHeader(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=()"
        );

        next();
    }
);

const ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000"
];

app.use(
    (req, res, next) => {

        const origin =
            req.headers.origin;

        if (
            origin &&
            ALLOWED_ORIGINS.includes(origin)
        ) {
            res.setHeader(
                "Access-Control-Allow-Origin",
                origin
            );

            res.setHeader(
                "Vary",
                "Origin"
            );
        }

        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        );

        res.setHeader(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        );

        if (
            req.method === "OPTIONS"
        ) {
            if (
                origin &&
                !ALLOWED_ORIGINS.includes(origin)
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "Bu kaynaktan gelen isteğe izin verilmiyor."
                    });
            }

            return res.sendStatus(
                204
            );
        }

        if (
            origin &&
            !ALLOWED_ORIGINS.includes(origin)
        ) {
            return res
                .status(403)
                .json({
                    success: false,
                    message:
                        "Bu kaynaktan gelen isteğe izin verilmiyor."
                });
        }

        next();
    }
);


const PRODUCT_CATALOG = {
    "Giriş Paketi": {
        type: "hosting",
        monthly: 29.90,
        yearly: 299.00
    },

    "Giriş Plus Paketi": {
        type: "hosting",
        monthly: 39.90,
        yearly: 399.00
    },

    "Uzman Paketi": {
        type: "hosting",
        monthly: 79.90,
        yearly: 799.00
    },

    "Limitsiz Plus Paketi": {
        type: "hosting",
        monthly: 99.90,
        yearly: 999.00
    },

    "Limitsiz Pro Paketi": {
        type: "hosting",
        monthly: 119.90,
        yearly: 1199.00
    },

    "Standart SSL (DV)": {
        type: "ssl",
        monthly: 49.90,
        yearly: 499.00
    },

    "Positive SSL": {
        type: "ssl",
        monthly: 89.90,
        yearly: 899.00
    },

    "Multi-Domain SSL": {
        type: "ssl",
        monthly: 149.90,
        yearly: 1499.00
    },

    "Wildcard SSL": {
        type: "ssl",
        monthly: 199.90,
        yearly: 1999.00
    },

    "Kurumsal Mail - Başlangıç": {
        type: "email",
        monthly: 39.90,
        yearly: 399.00
    },

    "Kurumsal Mail - Standart": {
        type: "email",
        monthly: 69.90,
        yearly: 699.00
    },

    "Kurumsal Mail - Profesyonel": {
        type: "email",
        monthly: 99.90,
        yearly: 999.00
    },

    "Kurumsal Mail - Kurumsal": {
        type: "email",
        monthly: 149.90,
        yearly: 1499.00
    },

    "VDS Başlangıç (2 GB RAM)": {
        type: "vds",
        monthly: 199.90,
        yearly: 1999.00
    },

    "VDS Standart (4 GB RAM)": {
        type: "vds",
        monthly: 349.90,
        yearly: 3499.00
    },

    "VDS Pro (8 GB RAM)": {
        type: "vds",
        monthly: 599.90,
        yearly: 5999.00
    },

    "VDS Elite (16 GB RAM)": {
        type: "vds",
        monthly: 999.90,
        yearly: 9999.00
    }
};

const DOMAIN_PRICES = {
    ".com": 399.90,
    ".com.tr": 89.90,
    ".tr": 49.90,
    ".net.tr": 49.90,
    ".org": 449.90,
    ".net": 499.90,
    ".info": 899.90,
    ".biz": 699.90
};

function normalizeEmail(email) {
    return String(email || "")
        .trim()
        .toLowerCase();
}
function cleanText(
    value,
    maxLength = 255
) {
    return String(
        value ?? ""
    )
        .replace(
            /[\u0000-\u001F\u007F]/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim()
        .slice(
            0,
            maxLength
        );
}


function isValidEmail(
    email
) {
    if (
        typeof email !== "string" ||
        email.length < 5 ||
        email.length > 254
    ) {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
        .test(
            email
        );
}


function validatePassword(
    password
) {
    if (
        typeof password !== "string"
    ) {
        return {
            valid: false,
            message:
                "Geçersiz şifre."
        };
    }

    if (
        password.length < 8
    ) {
        return {
            valid: false,
            message:
                "Şifre en az 8 karakter olmalıdır."
        };
    }

    if (
        password.length > 72
    ) {
        return {
            valid: false,
            message:
                "Şifre en fazla 72 karakter olabilir."
        };
    }

    if (
        !/[a-z]/.test(
            password
        )
    ) {
        return {
            valid: false,
            message:
                "Şifre en az bir küçük harf içermelidir."
        };
    }

    if (
        !/[A-Z]/.test(
            password
        )
    ) {
        return {
            valid: false,
            message:
                "Şifre en az bir büyük harf içermelidir."
        };
    }

    if (
        !/[0-9]/.test(
            password
        )
    ) {
        return {
            valid: false,
            message:
                "Şifre en az bir rakam içermelidir."
        };
    }

    return {
        valid: true,
        message: ""
    };
}




function normalizePeriod(period) {
    return period === "yıl"
        ? "yıl"
        : "ay";
}

function getExpiryDate(period) {
    const date = new Date();

    if (period === "yıl") {
        date.setFullYear(
            date.getFullYear() + 1
        );
    } else {
        date.setMonth(
            date.getMonth() + 1
        );
    }

    return date
        .toISOString()
        .split("T")[0];
}

function getServerProduct(item) {
    const name =
        String(item?.name || "")
            .trim();

    const period =
        normalizePeriod(item?.period);

    const product =
        PRODUCT_CATALOG[name];

    if (product) {
        return {
            name: name,
            type: product.type,
            period: period,

            price:
                period === "yıl"
                    ? Number(product.yearly)
                    : Number(product.monthly)
        };
    }

    const lowerName =
        name.toLowerCase();

    const matchedExtension =
        Object.keys(DOMAIN_PRICES)
            .sort(
                (a, b) =>
                    b.length - a.length
            )
            .find(
                extension =>
                    lowerName.endsWith(
                        extension
                    )
            );

    if (matchedExtension) {
        return {
            name: name,
            type: "domain",
            period: "yıl",

            price:
                Number(
                    DOMAIN_PRICES[
                        matchedExtension
                    ]
                )
        };
    }

    return null;
}

function createInvoiceNumber(nextId) {
    const now = new Date();

    const year =
        String(
            now.getFullYear()
        );

    const month =
        String(
            now.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        );

    const sequence =
        String(nextId)
            .padStart(
                6,
                "0"
            );

    return `ANZ-${year}${month}-${sequence}`;
}

function authMiddleware(
    req,
    res,
    next
) {
    try {
        const authHeader =
            typeof req.headers.authorization ===
            "string"
                ? req.headers.authorization.trim()
                : "";

        if (!authHeader) {
            return res
                .status(401)
                .json({
                    success: false,
                    message:
                        "Giriş yapmanız gerekiyor."
                });
        }


        const bearerMatch =
            authHeader.match(
                /^Bearer\s+(.+)$/i
            );

        if (!bearerMatch) {
            return res
                .status(401)
                .json({
                    success: false,
                    message:
                        "Oturum bilgisi geçersiz."
                });
        }


        const token =
            String(
                bearerMatch[1] || ""
            ).trim();


        if (
            !token ||
            token.length > 4096
        ) {
            return res
                .status(401)
                .json({
                    success: false,
                    message:
                        "Oturum bilgisi geçersiz."
                });
        }


        const decoded =
            jwt.verify(
                token,
                JWT_SECRET,
                {
                    algorithms: [
                        "HS256"
                    ]
                }
            );


        if (
            !decoded ||
            typeof decoded !== "object"
        ) {
            return res
                .status(401)
                .json({
                    success: false,
                    message:
                        "Oturum geçersiz veya süresi dolmuş."
                });
        }


        const userId =
            Number(
                decoded.id
            );


        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {
            return res
                .status(401)
                .json({
                    success: false,
                    message:
                        "Oturum geçersiz veya süresi dolmuş."
                });
        }


        const user =
            db.prepare(`
                SELECT
                    id,
                    name,
                    email,
                    role,
                    email_verified,
                    created_at
                FROM users
                WHERE id = ?
                LIMIT 1
            `)
            .get(
                userId
            );


        if (!user) {
            return res
                .status(401)
                .json({
                    success: false,
                    message:
                        "Oturum geçersiz veya kullanıcı bulunamadı."
                });
        }


        if (
            Number(
                user.email_verified
            ) !== 1
        ) {
            return res
                .status(403)
                .json({
                    success: false,
                    message:
                        "E-posta adresinizi doğrulamanız gerekiyor.",
                    requiresEmailVerification:
                        true
                });
        }


        if (
            user.role !== "user" &&
            user.role !== "admin"
        ) {
            return res
                .status(403)
                .json({
                    success: false,
                    message:
                        "Hesap yetkisi geçersiz."
                });
        }


        req.user = {
            id:
                Number(
                    user.id
                ),

            name:
                String(
                    user.name || ""
                ),

            email:
                normalizeEmail(
                    user.email
                ),

            role:
                user.role,

            email_verified:
                Number(
                    user.email_verified
                ),

            created_at:
                user.created_at
        };


        return next();

    } catch (error) {

        if (
            error?.name ===
                "TokenExpiredError" ||
            error?.name ===
                "JsonWebTokenError" ||
            error?.name ===
                "NotBeforeError"
        ) {
            return res
                .status(401)
                .json({
                    success: false,
                    message:
                        "Oturum geçersiz veya süresi dolmuş."
                });
        }


        console.error(
            "AUTH MIDDLEWARE ERROR:",
            error
        );


        return res
            .status(500)
            .json({
                success: false,
                message:
                    "Oturum kontrolü gerçekleştirilemedi."
            });
    }
}

function logServiceAction(
    userId,
    serviceId,
    action
) {
    try {
        const cleanAction =
            String(action || "")
                .trim()
                .slice(0, 1000);

        if (
            !cleanAction ||
            !Number.isInteger(Number(userId)) ||
            !Number.isInteger(Number(serviceId))
        ) {
            return false;
        }

        db.prepare(`
            INSERT INTO service_logs (
                user_id,
                service_id,
                action
            )
            VALUES (?, ?, ?)
        `).run(
            Number(userId),
            Number(serviceId),
            cleanAction
        );

        return true;

    } catch (error) {
        console.error(
            "SERVICE LOG WRITE ERROR:",
            error
        );

        return false;
    }
}
// ======================================================
// WHM BAĞLANTI TESTİ
// GET /api/admin/whm/test
// ======================================================

app.get(
    "/api/admin/whm/test",

    authMiddleware,
    adminMiddleware,

    async (req, res) => {
        try {

            if (
                !isWhmConfigured()
            ) {
                return res
                    .status(503)
                    .json({
                        success:
                            false,

                        configured:
                            false,

                        message:
                            "WHM bağlantı bilgileri henüz ayarlanmamış."
                    });
            }


            const result =
                await testWhmConnection();


            return res.json({
                success:
                    true,

                configured:
                    true,

                message:
                    "WHM bağlantısı başarılı.",

                version:
                    result.version
            });

        } catch (error) {

            console.error(
                "WHM TEST ERROR:",
                error.message
            );


            return res
                .status(502)
                .json({
                    success:
                        false,

                    configured:
                        true,

                    message:
                        "WHM sunucusuna bağlanılamadı."
                });
        }
    }
);
function adminMiddleware(
    req,
    res,
    next
) {
    try {
        const user =
            db.prepare(`
                SELECT
                    id,
                    name,
                    email,
                    role
                FROM users
                WHERE id = ?
            `)
            .get(
                req.user.id
            );

        if (!user) {
            return res
                .status(401)
                .json({
                    success: false,
                    message:
                        "Kullanıcı bulunamadı."
                });
        }

        if (
            user.role !==
            "admin"
        ) {
            return res
                .status(403)
                .json({
                    success: false,
                    message:
                        "Bu işlem için admin yetkisi gerekiyor."
                });
        }

        req.admin =
            user;

        next();

    } catch (error) {
        console.error(
            "ADMIN AUTH ERROR:",
            error
        );

        return res
            .status(500)
            .json({
                success: false,
                message:
                    "Admin yetkisi kontrol edilemedi."
            });
    }
}

app.get(
    "/",

    (req, res) => {
        return res.json({
            success: true,
            message:
                "ANAZHOSTING API çalışıyor."
        });
    }
);

app.get(
    "/api/status",

    (req, res) => {
        return res.json({
            success: true,
            status: "online",
            database: "sqlite"
        });
    }
);
app.post(
    "/api/auth/register",

    registerLimiter,

    async (req, res) => {
        try {

            const name =
                cleanText(
                    req.body?.name,
                    80
                );

            const email =
                normalizeEmail(
                    req.body?.email
                );

            const password =
                typeof req.body?.password ===
                "string"
                    ? req.body.password
                    : "";


            // ======================================================
            // AD SOYAD KONTROLÜ
            // ======================================================

            if (
                name.length < 2
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Ad soyad en az 2 karakter olmalıdır."
                    });
            }


            // ======================================================
            // E-POSTA KONTROLÜ
            // ======================================================

            if (
                !isValidEmail(
                    email
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçerli bir e-posta adresi girin."
                    });
            }


            // ======================================================
            // ŞİFRE KONTROLÜ
            // ======================================================

            const passwordCheck =
                validatePassword(
                    password
                );

            if (
                !passwordCheck.valid
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            passwordCheck.message
                    });
            }


            // ======================================================
            // KULLANICI ZATEN VAR MI?
            // ======================================================

            const existingUser =
                db.prepare(`
                    SELECT id
                    FROM users
                    WHERE email = ?
                    LIMIT 1
                `)
                .get(
                    email
                );

            if (
                existingUser
            ) {
                return res
                    .status(409)
                    .json({
                        success: false,
                        message:
                            "Bu e-posta adresi zaten kayıtlı."
                    });
            }


            // ======================================================
            // ŞİFRE HASH
            // ======================================================

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );


            // ======================================================
            // KULLANICI OLUŞTUR
            // ======================================================

            const result =
                db.prepare(`
                    INSERT INTO users
                    (
                        name,
                        email,
                        password,
                        role,
                        email_verified
                    )
                    VALUES (?, ?, ?, 'user', 0)
                `)
                .run(
                    name,
                    email,
                    passwordHash
                );


            // ======================================================
            // CEVAP
            // ======================================================

            return res
                .status(201)
                .json({
                    success: true,

                    message:
                        "Kayıt oluşturuldu. E-posta adresinizi doğrulayın.",

                    requiresEmailVerification:
                        true,

                    user: {
                        id:
                            Number(
                                result.lastInsertRowid
                            ),

                        name:
                            name,

                        email:
                            email,

                        role:
                            "user",

                        email_verified:
                            0
                    }
                });

        } catch (error) {

            console.error(
                "REGISTER ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Kayıt oluşturulamadı."
                });
        }
    }
);

app.post(
    "/api/auth/login",

    authLimiter,
    loginAccountLimiter,

    async (req, res) => {
        try {
            const email =
                normalizeEmail(
                    req.body?.email
                );

            const password =
                typeof req.body?.password ===
                "string"
                    ? req.body.password
                    : "";


            // ======================================================
            // LOGIN INPUT GÜVENLİĞİ
            // ======================================================

            if (
                !isValidEmail(email) ||
                password.length === 0 ||
                password.length > 200
            ) {
                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "E-posta veya şifre hatalı."
                    });
            }


            const user =
                db.prepare(`
                    SELECT
                        id,
                        name,
                        email,
                        password,
                        role,
                        email_verified,
                        created_at
                    FROM users
                    WHERE email = ?
                `)
                .get(email);


            if (!user) {
                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "E-posta veya şifre hatalı."
                    });
            }


            const passwordOk =
                await bcrypt.compare(
                    password,
                    user.password
                );


            if (!passwordOk) {
                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "E-posta veya şifre hatalı."
                    });
            }


            res.locals
                .loginPasswordCorrect =
                true;


            if (
                Number(
                    user.email_verified
                ) !== 1
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,

                        message:
                            "Giriş yapmadan önce e-posta adresinizi doğrulamanız gerekiyor.",

                        requiresEmailVerification:
                            true,

                        email:
                            user.email
                    });
            }


            const token =
                jwt.sign(
                    {
                        id:
                            user.id,

                        name:
                            user.name,

                        email:
                            user.email,

                        role:
                            user.role
                    },

                    JWT_SECRET,

                    {
                        algorithm:
                            "HS256",

                        expiresIn:
                            "7d"
                    }
                );


            return res.json({
                success: true,

                message:
                    "Giriş başarılı.",

                token:
                    token,

                user: {
                    id:
                        user.id,

                    name:
                        user.name,

                    email:
                        user.email,

                    role:
                        user.role,

                    email_verified:
                        Number(
                            user.email_verified
                        ),

                    created_at:
                        user.created_at
                }
            });

        } catch (error) {
            console.error(
                "LOGIN ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Giriş işlemi tamamlanamadı."
                });
        }
    }
);

app.get(
    "/api/services",

    authMiddleware,

    (req, res) => {
        try {
            const services =
                db.prepare(`
                    SELECT *
                    FROM services
                    WHERE user_id = ?
                    ORDER BY id DESC
                `)
                .all(
                    req.user.id
                );

            return res.json({
                success: true,
                services: services
            });

        } catch (error) {
            console.error(
                "SERVICES ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Hizmetler alınamadı."
                });
        }
    }
);

app.get(
    "/api/orders",

    authMiddleware,

    (req, res) => {
        try {
            const orders =
                db.prepare(`
                    SELECT *
                    FROM orders
                    WHERE user_id = ?
                    ORDER BY id DESC
                `)
                .all(
                    req.user.id
                );

            return res.json({
                success: true,
                orders: orders
            });

        } catch (error) {
            console.error(
                "ORDERS ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Siparişler alınamadı."
                });
        }
    }
);

app.get(
    "/api/invoices",

    authMiddleware,

    (req, res) => {
        try {
            const invoices =
                db.prepare(`
                    SELECT
                        id,
                        invoice_no,
                        order_id,
                        service_id,
                        service_name,
                        period,
                        subtotal,
                        tax_rate,
                        tax_amount,
                        amount,
                        currency,
                        type,
                        status,
                        created_at
                    FROM invoices
                    WHERE user_id = ?
                    ORDER BY id DESC
                `)
                .all(
                    req.user.id
                );

            return res.json({
                success: true,
                invoices: invoices
            });

        } catch (error) {
            console.error(
                "INVOICES ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Faturalar alınamadı."
                });
        }
    }
);

app.get(
    "/api/invoices/:id",

    authMiddleware,

    (req, res) => {
        try {
            const invoiceId =
                Number(
                    req.params.id
                );

            if (
                !Number.isInteger(invoiceId) ||
                invoiceId <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz fatura numarası."
                    });
            }

            const invoice =
                db.prepare(`
                    SELECT *
                    FROM invoices
                    WHERE id = ?
                    AND user_id = ?
                `)
                .get(
                    invoiceId,
                    req.user.id
                );

            if (!invoice) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Fatura bulunamadı."
                    });
            }

            return res.json({
                success: true,
                invoice: invoice
            });

        } catch (error) {
            console.error(
                "INVOICE DETAIL ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Fatura alınamadı."
                });
        }
    }
);

app.post(
    "/api/checkout",

    authMiddleware,

    (req, res) => {
        try {
            const body =
                req.body &&
                typeof req.body ===
                    "object"

                    ? req.body

                    : {};


            const items =
                body.items;


            if (
                !Array.isArray(items) ||
                items.length === 0
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Sepet boş."
                    });
            }


            if (
                items.length > 20
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Tek siparişte en fazla 20 ürün satın alınabilir."
                    });
            }


            const normalizedItems =
                [];

            const domainNames =
                new Set();


            for (
                const item
                of items
            ) {
                if (
                    !item ||
                    typeof item !==
                        "object" ||
                    Array.isArray(item)
                ) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            message:
                                "Geçersiz ürün."
                        });
                }


                if (
                    typeof item.name !==
                        "string" ||
                    item.name.trim()
                        .length < 1 ||
                    item.name.trim()
                        .length > 200
                ) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            message:
                                "Geçersiz ürün adı."
                        });
                }


                if (
                    item.period !==
                        "ay" &&
                    item.period !==
                        "yıl"
                ) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            message:
                                "Geçersiz satın alma dönemi."
                        });
                }


                const product =
                    getServerProduct(
                        item
                    );


                if (!product) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            message:
                                `Geçersiz ürün: ${
                                    String(
                                        item.name ||
                                        "Ürün"
                                    )
                                }`
                        });
                }


                if (
                    !Number.isFinite(
                        product.price
                    ) ||
                    product.price <= 0
                ) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            message:
                                "Geçersiz ürün fiyatı."
                        });
                }


                // =====================================
                // DOMAIN KONTROLÜ
                // =====================================

                if (
                    product.type ===
                    "domain"
                ) {
                    const cleanDomain =
                        normalizeFullDomain(
                            product.name
                        );


                    if (!cleanDomain) {
                        return res
                            .status(400)
                            .json({
                                success:
                                    false,

                                message:
                                    "Geçersiz domain adı."
                            });
                    }


                    const availability =
                        checkLocalDomain(
                            cleanDomain,
                            DOMAIN_PRICES
                        );


                    if (
                        !availability.valid
                    ) {
                        return res
                            .status(400)
                            .json({
                                success:
                                    false,

                                message:
                                    "Bu domain uzantısı desteklenmiyor."
                            });
                    }


                    if (
                        domainNames.has(
                            cleanDomain
                        )
                    ) {
                        return res
                            .status(409)
                            .json({
                                success:
                                    false,

                                message:
                                    `${cleanDomain} sepette birden fazla kez bulunuyor.`
                            });
                    }


                    domainNames.add(
                        cleanDomain
                    );


                    if (
                        !availability.available
                    ) {
                        return res
                            .status(409)
                            .json({
                                success:
                                    false,

                                message:
                                    `${cleanDomain} ANAZHOSTING sisteminde zaten kayıtlı.`
                            });
                    }


                    product.name =
                        cleanDomain;

                    product.period =
                        "yıl";
                }


                normalizedItems.push(
                    product
                );
            }


            const total =
                normalizedItems.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        Number(
                            item.price
                        ),

                    0
                );


            if (
                !Number.isFinite(
                    total
                ) ||
                total <= 0 ||
                total > 1000000
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Geçersiz sipariş toplamı."
                    });
            }


            const transaction =
                db.transaction(
                    () => {

                        /*
                        |--------------------------------------------------------------------------
                        | DOMAINLERİ TEKRAR KONTROL ET
                        |--------------------------------------------------------------------------
                        |
                        | Sepet kontrolünden sonra başka işlem oluşursa diye
                        | DB transaction içinde tekrar kontrol ediyoruz.
                        |
                        */

                        for (
                            const item
                            of normalizedItems
                        ) {
                            if (
                                item.type !==
                                "domain"
                            ) {
                                continue;
                            }


                            if (
                                isDomainLocallyTaken(
                                    item.name
                                )
                            ) {
                                const error =
                                    new Error(
                                        `${item.name} artık müsait değil.`
                                    );

                                error.code =
                                    "DOMAIN_TAKEN";

                                error.domain =
                                    item.name;

                                throw error;
                            }
                        }


                        // =====================================
                        // SİPARİŞ
                        // =====================================

                        const orderResult =
                            db.prepare(`
                                INSERT INTO orders
                                (
                                    user_id,
                                    total,
                                    status
                                )
                                VALUES (?, ?, ?)
                            `)
                            .run(
                                req.user.id,

                                Number(
                                    total.toFixed(
                                        2
                                    )
                                ),

                                "Tamamlandı"
                            );


                        const orderId =
                            Number(
                                orderResult
                                    .lastInsertRowid
                            );


                        const createdInvoices =
                            [];


                        // =====================================
                        // HİZMETLER
                        // =====================================

                        for (
                            const item
                            of normalizedItems
                        ) {
                            const expiryDate =
                                getExpiryDate(
                                    item.period
                                );


                            const serviceResult =
                                db.prepare(`
                                    INSERT INTO services
                                    (
                                        user_id,
                                        type,
                                        name,
                                        price,
                                        period,
                                        status,
                                        expiry_date
                                    )
                                    VALUES (?, ?, ?, ?, ?, ?, ?)
                                `)
                                .run(
                                    req.user.id,

                                    item.type,

                                    item.name,

                                    Number(
                                        item.price
                                            .toFixed(
                                                2
                                            )
                                    ),

                                    item.period,

                                    "Aktif",

                                    expiryDate
                                );


                            const serviceId =
                                Number(
                                    serviceResult
                                        .lastInsertRowid
                                );


                            logServiceAction(
                                req.user.id,

                                serviceId,

                                `Hizmet satın alındı: ${item.name}`
                            );


                            /*
                            |--------------------------------------------------------------------------
                            | DOMAIN VARSAYILAN NAMESERVER
                            |--------------------------------------------------------------------------
                            */

                            if (
                                item.type ===
                                "domain"
                            ) {
                                db.prepare(`
                                    INSERT INTO nameservers
                                    (
                                        user_id,
                                        service_id,
                                        domain,
                                        ns1,
                                        ns2
                                    )
                                    VALUES (?, ?, ?, ?, ?)
                                `)
                                .run(
                                    req.user.id,

                                    serviceId,

                                    item.name,

                                    "ns1.anazhosting.com.tr",

                                    "ns2.anazhosting.com.tr"
                                );
                            }


                            // =====================================
                            // KDV
                            // =====================================

                            const gross =
                                Number(
                                    item.price
                                        .toFixed(
                                            2
                                        )
                                );


                            const subtotal =
                                Number(
                                    (
                                        gross /
                                        1.20
                                    )
                                    .toFixed(
                                        2
                                    )
                                );


                            const taxAmount =
                                Number(
                                    (
                                        gross -
                                        subtotal
                                    )
                                    .toFixed(
                                        2
                                    )
                                );


                            const taxRate =
                                20;


                            // =====================================
                            // FATURA
                            // =====================================

                            const nextInvoiceRow =
                                db.prepare(`
                                    SELECT
                                        IFNULL(
                                            MAX(id),
                                            0
                                        ) + 1 AS next_id
                                    FROM invoices
                                `)
                                .get();


                            const invoiceNo =
                                createInvoiceNumber(
                                    nextInvoiceRow
                                        .next_id
                                );


                            const invoiceResult =
                                db.prepare(`
                                    INSERT INTO invoices
                                    (
                                        user_id,
                                        invoice_no,
                                        order_id,
                                        service_id,
                                        service_name,
                                        period,
                                        subtotal,
                                        tax_rate,
                                        tax_amount,
                                        amount,
                                        currency,
                                        type,
                                        status
                                    )
                                    VALUES
                                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `)
                                .run(
                                    req.user.id,

                                    invoiceNo,

                                    orderId,

                                    serviceId,

                                    item.name,

                                    item.period,

                                    subtotal,

                                    taxRate,

                                    taxAmount,

                                    gross,

                                    "TRY",

                                    "Satın Alma",

                                    "Ödendi"
                                );


                            createdInvoices.push({
                                id:
                                    Number(
                                        invoiceResult
                                            .lastInsertRowid
                                    ),

                                invoice_no:
                                    invoiceNo,

                                service_id:
                                    serviceId,

                                service_name:
                                    item.name,

                                amount:
                                    gross
                            });
                        }


                        return {
                            orderId:
                                orderId,

                            invoices:
                                createdInvoices
                        };
                    }
                );


            const result =
                transaction();


            return res
                .status(201)
                .json({
                    success:
                        true,

                    message:
                        "Sipariş başarıyla oluşturuldu.",

                    orderId:
                        result.orderId,

                    invoices:
                        result.invoices
                });


        } catch (error) {

            if (
                error?.code ===
                "DOMAIN_TAKEN"
            ) {
                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        message:
                            `${
                                error.domain ||
                                "Domain"
                            } artık müsait değil.`
                    });
            }


            console.error(
                "CHECKOUT ERROR:",
                error
            );


            return res
                .status(500)
                .json({
                    success:
                        false,

                    message:
                        "Sipariş oluşturulamadı."
                });
        }
    }
);

app.post(
    "/api/services/:id/renew",

    authMiddleware,

    (req, res) => {
        try {
            const serviceId =
                Number(
                    req.params.id
                );

            if (
                !Number.isInteger(serviceId) ||
                serviceId <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz hizmet numarası."
                    });
            }

            const service =
                db.prepare(`
                    SELECT *
                    FROM services
                    WHERE id = ?
                    AND user_id = ?
                `)
                .get(
                    serviceId,
                    req.user.id
                );

            if (!service) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Hizmet bulunamadı."
                    });
            }

            if (
                service.status ===
                "İptal Edildi"
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "İptal edilmiş hizmet yenilenemez."
                    });
            }

            const requestedPeriod =
                service.type === "domain"
                    ? "yıl"
                    : normalizePeriod(
                        req.body.period
                    );

            let finalPrice = 0;

            const product =
                PRODUCT_CATALOG[
                    service.name
                ];

            if (product) {
                finalPrice =
                    requestedPeriod === "yıl"

                        ? Number(
                            product.yearly
                        )

                        : Number(
                            product.monthly
                        );
            }

            else if (
                service.type === "domain"
            ) {
                const lowerName =
                    String(
                        service.name
                    )
                    .toLowerCase();

                const matchedExtension =
                    Object.keys(
                        DOMAIN_PRICES
                    )
                    .sort(
                        (a, b) =>
                            b.length -
                            a.length
                    )
                    .find(
                        extension =>
                            lowerName.endsWith(
                                extension
                            )
                    );

                if (!matchedExtension) {
                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "Domain yenileme fiyatı bulunamadı."
                        });
                }

                finalPrice =
                    Number(
                        DOMAIN_PRICES[
                            matchedExtension
                        ]
                    );
            }

            else {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Bu hizmet otomatik yenilemeyi desteklemiyor."
                    });
            }

            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            let baseDate;

            if (service.expiry_date) {
                baseDate =
                    new Date(
                        `${service.expiry_date}T00:00:00`
                    );
            } else {
                baseDate =
                    new Date(today);
            }

            if (
                Number.isNaN(
                    baseDate.getTime()
                ) ||
                baseDate < today
            ) {
                baseDate =
                    new Date(today);
            }

            if (
                service.type === "domain" ||
                requestedPeriod === "yıl"
            ) {
                baseDate.setFullYear(
                    baseDate.getFullYear() +
                    1
                );
            } else {
                baseDate.setMonth(
                    baseDate.getMonth() +
                    1
                );
            }

            const newExpiryDate =
                baseDate
                    .toISOString()
                    .split("T")[0];

            const finalPeriod =
                service.type === "domain"
                    ? "yıl"
                    : requestedPeriod;

            const transaction =
                db.transaction(() => {

                    const orderResult =
                        db.prepare(`
                            INSERT INTO orders
                            (
                                user_id,
                                total,
                                status
                            )
                            VALUES (?, ?, ?)
                        `)
                        .run(
                            req.user.id,

                            Number(
                                finalPrice.toFixed(2)
                            ),

                            "Tamamlandı"
                        );

                    const orderId =
                        Number(
                            orderResult.lastInsertRowid
                        );

                    db.prepare(`
                        UPDATE services

                        SET
                            price = ?,
                            period = ?,
                            status = ?,
                            expiry_date = ?

                        WHERE
                            id = ?
                            AND user_id = ?
                    `)
                    .run(
                        Number(
                            finalPrice.toFixed(2)
                        ),

                        finalPeriod,

                        "Aktif",

                        newExpiryDate,

                        serviceId,

                        req.user.id
                    );

                    const gross =
                        Number(
                            finalPrice.toFixed(2)
                        );

                    const subtotal =
                        Number(
                            (
                                gross /
                                1.20
                            )
                            .toFixed(2)
                        );

                    const taxAmount =
                        Number(
                            (
                                gross -
                                subtotal
                            )
                            .toFixed(2)
                        );

                    const taxRate =
                        20;

                    const nextInvoiceRow =
                        db.prepare(`
                            SELECT
                                IFNULL(
                                    MAX(id),
                                    0
                                ) + 1 AS next_id
                            FROM invoices
                        `)
                        .get();

                    const invoiceNo =
                        createInvoiceNumber(
                            nextInvoiceRow.next_id
                        );

                    const invoiceResult =
                        db.prepare(`
                            INSERT INTO invoices
                            (
                                user_id,
                                invoice_no,
                                order_id,
                                service_id,
                                service_name,
                                period,
                                subtotal,
                                tax_rate,
                                tax_amount,
                                amount,
                                currency,
                                type,
                                status
                            )
                            VALUES
                            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `)
                        .run(
                            req.user.id,
                            invoiceNo,
                            orderId,
                            serviceId,
                            service.name,
                            finalPeriod,
                            subtotal,
                            taxRate,
                            taxAmount,
                            gross,
                            "TRY",
                            "Yenileme",
                            "Ödendi"
                        );

                    return {
                        orderId:
                            orderId,

                        invoiceId:
                            Number(
                                invoiceResult.lastInsertRowid
                            ),

                        invoiceNo:
                            invoiceNo
                    };
                });

            const result =
                transaction();

            logServiceAction(
                req.user.id,
                serviceId,
                `Hizmet yenilendi (${finalPeriod}). Yeni bitiş tarihi: ${newExpiryDate}`
            );

            return res.json({
                success: true,

                message:
                    "Hizmet başarıyla yenilendi.",

                serviceId:
                    serviceId,

                newExpiryDate:
                    newExpiryDate,

                period:
                    finalPeriod,

                amount:
                    Number(
                        finalPrice.toFixed(2)
                    ),

                orderId:
                    result.orderId,

                invoiceId:
                    result.invoiceId,

                invoiceNo:
                    result.invoiceNo
            });

        } catch (error) {
            console.error(
                "RENEW ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Hizmet yenilenemedi."
                });
        }
    }
);

app.post(
    "/api/services/:id/cancel",

    authMiddleware,

    (req, res) => {
        try {
            const serviceId =
                Number(req.params.id);

            const userId =
                req.user.id;

            if (
                !Number.isInteger(serviceId) ||
                serviceId <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz hizmet numarası."
                    });
            }

            const service =
                db.prepare(`
                    SELECT *
                    FROM services
                    WHERE id = ?
                    AND user_id = ?
                `)
                .get(
                    serviceId,
                    userId
                );

            if (!service) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Hizmet bulunamadı."
                    });
            }

            if (
                service.status ===
                "İptal Edildi"
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Bu hizmet zaten iptal edilmiş."
                    });
            }

            const result =
                db.prepare(`
                    UPDATE services

                    SET status = ?

                    WHERE id = ?
                    AND user_id = ?
                `)
                .run(
                    "İptal Edildi",
                    serviceId,
                    userId
                );

            if (
                result.changes === 0
            ) {
                return res
                    .status(500)
                    .json({
                        success: false,
                        message:
                            "Hizmet durumu güncellenemedi."
                    });
            }

            logServiceAction(
                userId,
                serviceId,
                "Hizmet iptal edildi."
            );

            return res.json({
                success: true,

                message:
                    "Hizmet başarıyla iptal edildi.",

                service: {
                    id:
                        serviceId,

                    name:
                        service.name,

                    type:
                        service.type,

                    status:
                        "İptal Edildi",

                    expiry_date:
                        service.expiry_date
                }
            });

        } catch (error) {
            console.error(
                "CANCEL SERVICE ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Hizmet iptal edilirken bir hata oluştu."
                });
        }
    }
);

app.get(
    "/api/admin/stats",

    authMiddleware,
    adminMiddleware,

    (req, res) => {
        try {
            const users =
                db.prepare(`
                    SELECT COUNT(*) AS total
                    FROM users
                `)
                .get();

            const activeServices =
                db.prepare(`
                    SELECT COUNT(*) AS total
                    FROM services
                    WHERE status = 'Aktif'
                `)
                .get();

            const orders =
                db.prepare(`
                    SELECT COUNT(*) AS total
                    FROM orders
                `)
                .get();

            const revenue =
                db.prepare(`
                    SELECT
                        COALESCE(
                            SUM(amount),
                            0
                        ) AS total
                    FROM invoices
                    WHERE status = 'Ödendi'
                `)
                .get();

            return res.json({
                success: true,

                users:
                    Number(
                        users.total || 0
                    ),

                activeServices:
                    Number(
                        activeServices.total || 0
                    ),

                orders:
                    Number(
                        orders.total || 0
                    ),

                revenue:
                    Number(
                        revenue.total || 0
                    )
            });

        } catch (error) {
            console.error(
                "ADMIN STATS ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Admin istatistikleri alınamadı."
                });
        }
    }
);

app.get(
    "/api/admin/users",

    authMiddleware,
    adminMiddleware,

    (req, res) => {
        try {
            const users =
                db.prepare(`
                    SELECT
                        id,
                        name,
                        email,
                        role,
                        created_at
                    FROM users
                    ORDER BY id DESC
                `)
                .all();

            return res.json({
                success: true,
                users: users
            });

        } catch (error) {
            console.error(
                "ADMIN USERS ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Kullanıcılar alınamadı."
                });
        }
    }
);

app.patch(
    "/api/admin/users/:id/role",

    authMiddleware,
    adminMiddleware,

    (req, res) => {
        try {
            const userId =
                Number(
                    req.params.id
                );

            const role =
                String(
                    req.body.role || ""
                )
                .trim()
                .toLowerCase();

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz kullanıcı ID."
                    });
            }

            if (
                role !== "admin" &&
                role !== "user"
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz kullanıcı rolü."
                    });
            }

            const targetUser =
                db.prepare(`
                    SELECT
                        id,
                        name,
                        email,
                        role
                    FROM users
                    WHERE id = ?
                `)
                .get(
                    userId
                );

            if (!targetUser) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Kullanıcı bulunamadı."
                    });
            }

            if (
                Number(userId) ===
                    Number(req.admin.id) &&
                role !== "admin"
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Kendi admin yetkinizi kaldıramazsınız."
                    });
            }

            db.prepare(`
                UPDATE users
                SET role = ?
                WHERE id = ?
            `)
            .run(
                role,
                userId
            );

            return res.json({
                success: true,

                message:
                    "Kullanıcı rolü güncellendi.",

                user: {
                    id:
                        targetUser.id,

                    name:
                        targetUser.name,

                    email:
                        targetUser.email,

                    role:
                        role
                }
            });

        } catch (error) {
            console.error(
                "ADMIN USER ROLE ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Kullanıcı rolü güncellenemedi."
                });
        }
    }
);

app.get(
    "/api/admin/services",

    authMiddleware,
    adminMiddleware,

    (req, res) => {
        try {
            const services =
                db.prepare(`
                    SELECT
                        services.*,

                        users.name
                            AS user_name,

                        users.email
                            AS user_email

                    FROM services

                    LEFT JOIN users
                        ON users.id =
                           services.user_id

                    ORDER BY services.id DESC
                `)
                .all();

            return res.json({
                success: true,
                services: services
            });

        } catch (error) {
            console.error(
                "ADMIN SERVICES ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Hizmetler alınamadı."
                });
        }
    }
);

app.patch(
    "/api/admin/services/:id/status",

    authMiddleware,
    adminMiddleware,

    (req, res) => {
        try {
            const serviceId =
                Number(
                    req.params.id
                );

            const status =
                String(
                    req.body.status || ""
                )
                .trim();

            if (
                !Number.isInteger(serviceId) ||
                serviceId <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz hizmet ID."
                    });
            }

            const allowedStatuses = [
                "Aktif",
                "Süresi Doldu",
                "İptal Edildi"
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz hizmet durumu."
                    });
            }

            const service =
                db.prepare(`
                    SELECT *
                    FROM services
                    WHERE id = ?
                `)
                .get(
                    serviceId
                );

            if (!service) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Hizmet bulunamadı."
                    });
            }

            db.prepare(`
                UPDATE services
                SET status = ?
                WHERE id = ?
            `)
            .run(
                status,
                serviceId
            );

            logServiceAction(
                service.user_id,
                serviceId,
                `Hizmet durumu yönetici tarafından "${status}" olarak değiştirildi.`
            );

            return res.json({
                success: true,

                message:
                    "Hizmet durumu güncellendi.",

                service: {
                    id:
                        serviceId,

                    name:
                        service.name,

                    status:
                        status
                }
            });

        } catch (error) {
            console.error(
                "ADMIN SERVICE STATUS ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Hizmet durumu güncellenemedi."
                });
        }
    }
);

app.get(
    "/api/admin/orders",

    authMiddleware,
    adminMiddleware,

    (req, res) => {
        try {
            const orders =
                db.prepare(`
                    SELECT
                        orders.*,

                        users.name
                            AS user_name,

                        users.email
                            AS user_email

                    FROM orders

                    LEFT JOIN users
                        ON users.id =
                           orders.user_id

                    ORDER BY orders.id DESC
                `)
                .all();

            return res.json({
                success: true,
                orders: orders
            });

        } catch (error) {
            console.error(
                "ADMIN ORDERS ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Siparişler alınamadı."
                });
        }
    }
);

app.get(
    "/api/admin/invoices",

    authMiddleware,
    adminMiddleware,

    (req, res) => {
        try {
            const invoices =
                db.prepare(`
                    SELECT
                        invoices.*,

                        users.name
                            AS user_name,

                        users.email
                            AS user_email

                    FROM invoices

                    LEFT JOIN users
                        ON users.id =
                           invoices.user_id

                    ORDER BY invoices.id DESC
                `)
                .all();

            return res.json({
                success: true,
                invoices: invoices
            });

        } catch (error) {
            console.error(
                "ADMIN INVOICES ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Faturalar alınamadı."
                });
        }
    }
);

function getOwnedDomainService(userId, serviceId) {
    return db.prepare(`
        SELECT *
        FROM services

        WHERE id = ?
        AND user_id = ?
        AND type = 'domain'
    `).get(
        serviceId,
        userId
    );
}

app.get(
    "/api/services/:id/dns",

    authMiddleware,

    (req, res) => {
        try {
            const serviceId =
                Number(req.params.id);

            if (
                !Number.isInteger(serviceId) ||
                serviceId <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz domain hizmeti."
                    });
            }

            const service =
                getOwnedDomainService(
                    req.user.id,
                    serviceId
                );

            if (!service) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Domain hizmeti bulunamadı."
                    });
            }

            const records =
                db.prepare(`
                    SELECT *
                    FROM dns_records

                    WHERE user_id = ?
                    AND service_id = ?

                    ORDER BY id ASC
                `)
                .all(
                    req.user.id,
                    serviceId
                );

            return res.json({
                success: true,
                domain: service.name,
                records
            });

        } catch (error) {
            console.error(
                "DNS LIST ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "DNS kayıtları alınamadı."
                });
        }
    }
);

app.post(
    "/api/services/:id/dns",

    authMiddleware,

    (req, res) => {
        try {
            const serviceId =
                Number(req.params.id);

            const type =
                String(
                    req.body.type || ""
                )
                .trim()
                .toUpperCase();

            const name =
                String(
                    req.body.name || ""
                )
                .trim();

            const value =
                String(
                    req.body.value || ""
                )
                .trim();

            const ttl =
                Number(
                    req.body.ttl || 3600
                );

            let priority =
                req.body.priority !== undefined &&
                req.body.priority !== null &&
                req.body.priority !== ""

                    ? Number(req.body.priority)

                    : null;

            if (
                !Number.isInteger(serviceId) ||
                serviceId <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz domain hizmeti."
                    });
            }

            const service =
                getOwnedDomainService(
                    req.user.id,
                    serviceId
                );

            if (!service) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Domain hizmeti bulunamadı."
                    });
            }

            const allowedTypes = [
                "A",
                "AAAA",
                "CNAME",
                "MX",
                "TXT",
                "NS"
            ];

            if (
                !allowedTypes.includes(type)
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz DNS kayıt türü."
                    });
            }

            if (
                !name ||
                !value
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "DNS adı ve değeri zorunludur."
                    });
            }

            if (
                !Number.isInteger(ttl) ||
                ttl < 60 ||
                ttl > 86400
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "TTL 60 ile 86400 arasında olmalıdır."
                    });
            }

            if (type === "MX") {

                if (
                    priority === null ||
                    !Number.isInteger(priority) ||
                    priority < 0 ||
                    priority > 65535
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "MX kaydı için geçerli priority zorunludur."
                        });
                }

            } else {
                priority = null;
            }

            const result =
                db.prepare(`
                    INSERT INTO dns_records
                    (
                        user_id,
                        service_id,
                        domain,
                        type,
                        name,
                        value,
                        ttl,
                        priority
                    )

                    VALUES
                    (
                        ?, ?, ?, ?, ?, ?, ?, ?
                    )
                `)
                .run(
                    req.user.id,
                    serviceId,
                    service.name,
                    type,
                    name,
                    value,
                    ttl,
                    priority
                );

            const record =
                db.prepare(`
                    SELECT *
                    FROM dns_records
                    WHERE id = ?
                `)
                .get(
                    Number(
                        result.lastInsertRowid
                    )
                );

            logServiceAction(
                req.user.id,
                serviceId,
                `${type} DNS kaydı eklendi: ${name} → ${value}`
            );

            return res
                .status(201)
                .json({
                    success: true,

                    message:
                        "DNS kaydı eklendi.",

                    record
                });

        } catch (error) {
            console.error(
                "DNS CREATE ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "DNS kaydı eklenemedi."
                });
        }
    }
);

app.patch(
    "/api/services/:serviceId/dns/:recordId",

    authMiddleware,

    (req, res) => {
        try {
            const serviceId =
                Number(req.params.serviceId);

            const recordId =
                Number(req.params.recordId);

            const service =
                getOwnedDomainService(
                    req.user.id,
                    serviceId
                );

            if (!service) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Domain hizmeti bulunamadı."
                    });
            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM dns_records

                    WHERE id = ?
                    AND service_id = ?
                    AND user_id = ?
                `)
                .get(
                    recordId,
                    serviceId,
                    req.user.id
                );

            if (!existing) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "DNS kaydı bulunamadı."
                    });
            }

            const type =
                String(
                    req.body.type ??
                    existing.type
                )
                .trim()
                .toUpperCase();

            const name =
                String(
                    req.body.name ??
                    existing.name
                )
                .trim();

            const value =
                String(
                    req.body.value ??
                    existing.value
                )
                .trim();

            const ttl =
                Number(
                    req.body.ttl ??
                    existing.ttl
                );

            let priority =
                req.body.priority !== undefined
                    ? req.body.priority
                    : existing.priority;

            priority =
                priority === "" ||
                priority === null ||
                priority === undefined

                    ? null
                    : Number(priority);

            const allowedTypes = [
                "A",
                "AAAA",
                "CNAME",
                "MX",
                "TXT",
                "NS"
            ];

            if (
                !allowedTypes.includes(type)
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz DNS kayıt türü."
                    });
            }

            if (!name || !value) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "DNS adı ve değeri zorunludur."
                    });
            }

            if (
                !Number.isInteger(ttl) ||
                ttl < 60 ||
                ttl > 86400
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz TTL."
                    });
            }

            if (type !== "MX") {
                priority = null;
            }

            db.prepare(`
                UPDATE dns_records

                SET
                    type = ?,
                    name = ?,
                    value = ?,
                    ttl = ?,
                    priority = ?

                WHERE id = ?
                AND service_id = ?
                AND user_id = ?
            `)
            .run(
                type,
                name,
                value,
                ttl,
                priority,
                recordId,
                serviceId,
                req.user.id
            );

            const updated =
                db.prepare(`
                    SELECT *
                    FROM dns_records
                    WHERE id = ?
                `)
                .get(recordId);

            logServiceAction(
                req.user.id,
                serviceId,
                `${type} DNS kaydı güncellendi: ${name} → ${value}`
            );

            return res.json({
                success: true,

                message:
                    "DNS kaydı güncellendi.",

                record: updated
            });

        } catch (error) {
            console.error(
                "DNS UPDATE ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "DNS kaydı güncellenemedi."
                });
        }
    }
);

app.delete(
    "/api/services/:serviceId/dns/:recordId",

    authMiddleware,

    (req, res) => {
        try {
            const serviceId =
                Number(req.params.serviceId);

            const recordId =
                Number(req.params.recordId);

            const service =
                getOwnedDomainService(
                    req.user.id,
                    serviceId
                );

            if (!service) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Domain hizmeti bulunamadı."
                    });
            }

            const record =
                db.prepare(`
                    SELECT *
                    FROM dns_records

                    WHERE id = ?
                    AND service_id = ?
                    AND user_id = ?
                `)
                .get(
                    recordId,
                    serviceId,
                    req.user.id
                );

            const result =
                db.prepare(`
                    DELETE FROM dns_records

                    WHERE id = ?
                    AND service_id = ?
                    AND user_id = ?
                `)
                .run(
                    recordId,
                    serviceId,
                    req.user.id
                );

            if (result.changes === 0) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "DNS kaydı bulunamadı."
                    });
            }

            logServiceAction(
                req.user.id,
                serviceId,

                record
                    ? `${record.type} DNS kaydı silindi: ${record.name} → ${record.value}`
                    : "DNS kaydı silindi."
            );

            return res.json({
                success: true,
                message:
                    "DNS kaydı silindi."
            });

        } catch (error) {
            console.error(
                "DNS DELETE ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "DNS kaydı silinemedi."
                });
        }
    }
);

app.get(
    "/api/services/:id/nameservers",

    authMiddleware,

    (req, res) => {
        try {
            const serviceId =
                Number(req.params.id);

            const service =
                getOwnedDomainService(
                    req.user.id,
                    serviceId
                );

            if (!service) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Domain hizmeti bulunamadı."
                    });
            }

            let nameservers =
                db.prepare(`
                    SELECT *
                    FROM nameservers

                    WHERE service_id = ?
                    AND user_id = ?
                `)
                .get(
                    serviceId,
                    req.user.id
                );

            if (!nameservers) {
                const result =
                    db.prepare(`
                        INSERT INTO nameservers
                        (
                            user_id,
                            service_id,
                            domain,
                            ns1,
                            ns2
                        )

                        VALUES (?, ?, ?, ?, ?)
                    `)
                    .run(
                        req.user.id,
                        serviceId,
                        service.name,
                        "ns1.anazhosting.com.tr",
                        "ns2.anazhosting.com.tr"
                    );

                nameservers =
                    db.prepare(`
                        SELECT *
                        FROM nameservers
                        WHERE id = ?
                    `)
                    .get(
                        Number(
                            result.lastInsertRowid
                        )
                    );
            }

            return res.json({
                success: true,
                nameservers
            });

        } catch (error) {
            console.error(
                "NAMESERVER GET ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Nameserver bilgileri alınamadı."
                });
        }
    }
);

app.patch(
    "/api/services/:id/nameservers",

    authMiddleware,

    (req, res) => {
        try {
            const serviceId =
                Number(req.params.id);

            const ns1 =
                String(
                    req.body.ns1 || ""
                )
                .trim()
                .toLowerCase();

            const ns2 =
                String(
                    req.body.ns2 || ""
                )
                .trim()
                .toLowerCase();

            const service =
                getOwnedDomainService(
                    req.user.id,
                    serviceId
                );

            if (!service) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Domain hizmeti bulunamadı."
                    });
            }

            if (!ns1 || !ns2) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "NS1 ve NS2 zorunludur."
                    });
            }

            const existing =
                db.prepare(`
                    SELECT id
                    FROM nameservers

                    WHERE service_id = ?
                    AND user_id = ?
                `)
                .get(
                    serviceId,
                    req.user.id
                );

            if (existing) {
                db.prepare(`
                    UPDATE nameservers

                    SET
                        ns1 = ?,
                        ns2 = ?,
                        updated_at = CURRENT_TIMESTAMP

                    WHERE service_id = ?
                    AND user_id = ?
                `)
                .run(
                    ns1,
                    ns2,
                    serviceId,
                    req.user.id
                );

            } else {
                db.prepare(`
                    INSERT INTO nameservers
                    (
                        user_id,
                        service_id,
                        domain,
                        ns1,
                        ns2
                    )

                    VALUES (?, ?, ?, ?, ?)
                `)
                .run(
                    req.user.id,
                    serviceId,
                    service.name,
                    ns1,
                    ns2
                );
            }

            const nameservers =
                db.prepare(`
                    SELECT *
                    FROM nameservers

                    WHERE service_id = ?
                    AND user_id = ?
                `)
                .get(
                    serviceId,
                    req.user.id
                );

            logServiceAction(
                req.user.id,
                serviceId,
                `Nameserver bilgileri güncellendi: ${ns1}, ${ns2}`
            );

            return res.json({
                success: true,

                message:
                    "Nameserver bilgileri güncellendi.",

                nameservers
            });

        } catch (error) {
            console.error(
                "NAMESERVER UPDATE ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Nameserver bilgileri güncellenemedi."
                });
        }
    }
);

function getOwnedSslService(serviceId, userId) {
    return db.prepare(`
        SELECT *
        FROM services
        WHERE id = ?
        AND user_id = ?
        AND type = 'ssl'
    `).get(
        Number(serviceId),
        Number(userId)
    );
}

app.get(
    '/api/services/:id/ssl',

    authMiddleware,

    (req, res) => {
        try {
            const service =
                getOwnedSslService(
                    req.params.id,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    message:
                        'SSL hizmeti bulunamadı.'
                });
            }

            let ssl =
                db.prepare(`
                    SELECT *
                    FROM ssl_certificates
                    WHERE service_id = ?
                      AND user_id = ?
                `).get(
                    service.id,
                    req.user.id
                );

            if (!ssl) {
                const result =
                    db.prepare(`
                        INSERT INTO ssl_certificates (
                            user_id,
                            service_id,
                            status,
                            expires_at
                        )
                        VALUES (?, ?, ?, ?)
                    `).run(
                        req.user.id,
                        service.id,
                        'Bekliyor',
                        service.expiry_date || null
                    );

                ssl =
                    db.prepare(`
                        SELECT *
                        FROM ssl_certificates
                        WHERE id = ?
                    `).get(
                        result.lastInsertRowid
                    );
            }

            return res.json({
                ssl
            });

        } catch (error) {
            console.error(
                'SSL GET ERROR:',
                error
            );

            return res.status(500).json({
                message:
                    'SSL bilgileri alınamadı.'
            });
        }
    }
);

app.patch(
    '/api/services/:id/ssl',

    authMiddleware,

    (req, res) => {
        try {
            const service =
                getOwnedSslService(
                    req.params.id,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    message:
                        'SSL hizmeti bulunamadı.'
                });
            }

            const domain =
                String(
                    req.body.domain || ''
                )
                .trim()
                .toLowerCase();

            if (!domain) {
                return res.status(400).json({
                    message:
                        'Domain adı zorunlu.'
                });
            }

            const domainRegex =
                /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

            if (!domainRegex.test(domain)) {
                return res.status(400).json({
                    message:
                        'Geçerli bir domain girin.'
                });
            }

            let ssl =
                db.prepare(`
                    SELECT *
                    FROM ssl_certificates
                    WHERE service_id = ?
                      AND user_id = ?
                `).get(
                    service.id,
                    req.user.id
                );

            if (!ssl) {
                db.prepare(`
                    INSERT INTO ssl_certificates (
                        user_id,
                        service_id,
                        domain,
                        status,
                        expires_at
                    )
                    VALUES (?, ?, ?, ?, ?)
                `).run(
                    req.user.id,
                    service.id,
                    domain,
                    'Bekliyor',
                    service.expiry_date || null
                );

            } else {
                db.prepare(`
                    UPDATE ssl_certificates

                    SET domain = ?,
                        status = 'Bekliyor',
                        issued_at = NULL,
                        updated_at = CURRENT_TIMESTAMP

                    WHERE service_id = ?
                      AND user_id = ?
                `).run(
                    domain,
                    service.id,
                    req.user.id
                );
            }

            const updated =
                db.prepare(`
                    SELECT *
                    FROM ssl_certificates
                    WHERE service_id = ?
                      AND user_id = ?
                `).get(
                    service.id,
                    req.user.id
                );

            logServiceAction(
                req.user.id,
                service.id,
                `SSL domaini güncellendi: ${domain}`
            );

            return res.json({
                message:
                    'SSL domaini güncellendi.',

                ssl:
                    updated
            });

        } catch (error) {
            console.error(
                'SSL UPDATE ERROR:',
                error
            );

            return res.status(500).json({
                message:
                    'SSL domaini güncellenemedi.'
            });
        }
    }
);

app.post(
    '/api/services/:id/ssl/activate',

    authMiddleware,

    (req, res) => {
        try {
            const service =
                getOwnedSslService(
                    req.params.id,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    message:
                        'SSL hizmeti bulunamadı.'
                });
            }

            const ssl =
                db.prepare(`
                    SELECT *
                    FROM ssl_certificates
                    WHERE service_id = ?
                      AND user_id = ?
                `).get(
                    service.id,
                    req.user.id
                );

            if (!ssl) {
                return res.status(404).json({
                    message:
                        'SSL kaydı bulunamadı.'
                });
            }

            if (!ssl.domain) {
                return res.status(400).json({
                    message:
                        'Önce SSL hizmetine bir domain bağlayın.'
                });
            }

            const issuedAt =
                new Date()
                    .toISOString()
                    .split('T')[0];

            const expiresAt =
                service.expiry_date ||
                ssl.expires_at;

            db.prepare(`
                UPDATE ssl_certificates

                SET status = 'Aktif',
                    issued_at = ?,
                    expires_at = ?,
                    updated_at = CURRENT_TIMESTAMP

                WHERE service_id = ?
                  AND user_id = ?
            `).run(
                issuedAt,
                expiresAt,
                service.id,
                req.user.id
            );

            const updated =
                db.prepare(`
                    SELECT *
                    FROM ssl_certificates
                    WHERE service_id = ?
                      AND user_id = ?
                `).get(
                    service.id,
                    req.user.id
                );

            logServiceAction(
                req.user.id,
                service.id,

                updated?.domain
                    ? `SSL sertifikası aktif edildi: ${updated.domain}`
                    : "SSL sertifikası aktif edildi."
            );

            return res.json({
                message:
                    'SSL başarıyla aktif edildi.',

                ssl:
                    updated
            });

        } catch (error) {
            console.error(
                'SSL ACTIVATE ERROR:',
                error
            );

            return res.status(500).json({
                message:
                    'SSL aktif edilemedi.'
            });
        }
    }
);

app.patch(
    '/api/services/:id/ssl/auto-renew',

    authMiddleware,

    (req, res) => {
        try {
            const service =
                getOwnedSslService(
                    req.params.id,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    message:
                        'SSL hizmeti bulunamadı.'
                });
            }

            const enabled =
                req.body.enabled === true ||
                req.body.enabled === 1;

            const result =
                db.prepare(`
                    UPDATE ssl_certificates

                    SET auto_renew = ?,
                        updated_at = CURRENT_TIMESTAMP

                    WHERE service_id = ?
                      AND user_id = ?
                `).run(
                    enabled ? 1 : 0,
                    service.id,
                    req.user.id
                );

            if (
                result.changes === 0
            ) {
                return res.status(404).json({
                    message:
                        'SSL kaydı bulunamadı.'
                });
            }

            logServiceAction(
                req.user.id,
                service.id,

                enabled
                    ? "SSL otomatik yenileme açıldı."
                    : "SSL otomatik yenileme kapatıldı."
            );

            return res.json({
                message:
                    enabled
                        ? 'Otomatik yenileme açıldı.'
                        : 'Otomatik yenileme kapatıldı.',

                autoRenew:
                    enabled
            });

        } catch (error) {
            console.error(
                'SSL AUTO RENEW ERROR:',
                error
            );

            return res.status(500).json({
                message:
                    'Otomatik yenileme değiştirilemedi.'
            });
        }
    }
);

function getOwnedMailService(serviceId, userId) {
    return db.prepare(`
        SELECT *
        FROM services
        WHERE id = ?
          AND user_id = ?
          AND type = 'email'
    `).get(
        Number(serviceId),
        Number(userId)
    );
}

app.get(
    '/api/services/:id/mail',

    authMiddleware,

    (req, res) => {
        try {
            const service =
                getOwnedMailService(
                    req.params.id,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    message:
                        'Kurumsal mail hizmeti bulunamadı.'
                });
            }

            let mailDomain =
                db.prepare(`
                    SELECT *
                    FROM mail_domains
                    WHERE service_id = ?
                      AND user_id = ?
                `).get(
                    service.id,
                    req.user.id
                );

            if (!mailDomain) {
                const result =
                    db.prepare(`
                        INSERT INTO mail_domains (
                            user_id,
                            service_id,
                            status
                        )
                        VALUES (?, ?, ?)
                    `).run(
                        req.user.id,
                        service.id,
                        'Bekliyor'
                    );

                mailDomain =
                    db.prepare(`
                        SELECT *
                        FROM mail_domains
                        WHERE id = ?
                    `).get(
                        result.lastInsertRowid
                    );
            }

            const mailboxes =
                db.prepare(`
                    SELECT
                        id,
                        email,
                        quota_mb,
                        status,
                        created_at,
                        updated_at

                    FROM mailboxes

                    WHERE service_id = ?
                      AND user_id = ?

                    ORDER BY id DESC
                `).all(
                    service.id,
                    req.user.id
                );

            return res.json({
                service: {
                    id: service.id,
                    name: service.name,
                    status: service.status,
                    expiry_date: service.expiry_date
                },

                mail:
                    mailDomain,

                mailboxes:
                    mailboxes
            });

        } catch (error) {
            console.error(
                'MAIL GET ERROR:',
                error
            );

            return res.status(500).json({
                message:
                    'Mail bilgileri alınamadı.'
            });
        }
    }
);

app.patch(
    '/api/services/:id/mail/domain',

    authMiddleware,

    (req, res) => {
        try {
            const service =
                getOwnedMailService(
                    req.params.id,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    message:
                        'Kurumsal mail hizmeti bulunamadı.'
                });
            }

            if (
                service.status ===
                'İptal Edildi'
            ) {
                return res.status(400).json({
                    message:
                        'İptal edilmiş hizmet üzerinde işlem yapılamaz.'
                });
            }

            const domain =
                String(
                    req.body.domain || ''
                )
                .trim()
                .toLowerCase()
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .replace(/\/.*$/, '');

            if (!domain) {
                return res.status(400).json({
                    message:
                        'Domain adı zorunlu.'
                });
            }

            const domainRegex =
                /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

            if (!domainRegex.test(domain)) {
                return res.status(400).json({
                    message:
                        'Geçerli bir domain girin.'
                });
            }

            let mailDomain =
                db.prepare(`
                    SELECT *
                    FROM mail_domains
                    WHERE service_id = ?
                      AND user_id = ?
                `).get(
                    service.id,
                    req.user.id
                );

            if (!mailDomain) {
                db.prepare(`
                    INSERT INTO mail_domains (
                        user_id,
                        service_id,
                        domain,
                        status
                    )
                    VALUES (?, ?, ?, ?)
                `).run(
                    req.user.id,
                    service.id,
                    domain,
                    'Aktif'
                );

            } else {

                if (
                    mailDomain.domain &&
                    mailDomain.domain !== domain
                ) {
                    db.prepare(`
                        DELETE FROM mailboxes
                        WHERE service_id = ?
                          AND user_id = ?
                    `).run(
                        service.id,
                        req.user.id
                    );
                }

                db.prepare(`
                    UPDATE mail_domains

                    SET domain = ?,
                        status = 'Aktif',
                        updated_at = CURRENT_TIMESTAMP

                    WHERE service_id = ?
                      AND user_id = ?
                `).run(
                    domain,
                    service.id,
                    req.user.id
                );
            }

            const updated =
                db.prepare(`
                    SELECT *
                    FROM mail_domains
                    WHERE service_id = ?
                      AND user_id = ?
                `).get(
                    service.id,
                    req.user.id
                );

            logServiceAction(
                req.user.id,
                service.id,
                `Mail domaini güncellendi: ${domain}`
            );

            return res.json({
                message:
                    'Mail domaini başarıyla kaydedildi.',

                mail:
                    updated
            });

        } catch (error) {
            console.error(
                'MAIL DOMAIN UPDATE ERROR:',
                error
            );

            return res.status(500).json({
                message:
                    'Mail domaini kaydedilemedi.'
            });
        }
    }
);

app.get(
    '/api/services/:id/mailboxes',

    authMiddleware,

    (req, res) => {
        try {
            const service =
                getOwnedMailService(
                    req.params.id,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    message:
                        'Kurumsal mail hizmeti bulunamadı.'
                });
            }

            const mailboxes =
                db.prepare(`
                    SELECT
                        id,
                        email,
                        quota_mb,
                        status,
                        created_at,
                        updated_at

                    FROM mailboxes

                    WHERE service_id = ?
                      AND user_id = ?

                    ORDER BY id DESC
                `).all(
                    service.id,
                    req.user.id
                );

            return res.json({
                mailboxes
            });

        } catch (error) {
            console.error(
                'MAILBOX LIST ERROR:',
                error
            );

            return res.status(500).json({
                message:
                    'Mail hesapları alınamadı.'
            });
        }
    }
);

app.post(
    '/api/services/:id/mailboxes',

    authMiddleware,

    async (req, res) => {
        try {
            const service =
                getOwnedMailService(
                    req.params.id,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    message:
                        'Kurumsal mail hizmeti bulunamadı.'
                });
            }

            if (
                service.status ===
                'İptal Edildi'
            ) {
                return res.status(400).json({
                    message:
                        'İptal edilmiş hizmet üzerinde işlem yapılamaz.'
                });
            }

            const mailDomain =
                db.prepare(`
                    SELECT *
                    FROM mail_domains
                    WHERE service_id = ?
                      AND user_id = ?
                `).get(
                    service.id,
                    req.user.id
                );

            if (
                !mailDomain ||
                !mailDomain.domain
            ) {
                return res.status(400).json({
                    message:
                        'Önce mail hizmetine bir domain bağlayın.'
                });
            }

            let username =
                String(
                    req.body.username || ''
                )
                .trim()
                .toLowerCase();

            const password =
                String(
                    req.body.password || ''
                );

            let quotaMb =
                Number(
                    req.body.quota_mb || 1024
                );

            if (username.includes('@')) {
                username =
                    username.split('@')[0];
            }

            const usernameRegex =
                /^[a-z0-9._-]{1,64}$/i;

            if (
                !username ||
                !usernameRegex.test(username)
            ) {
                return res.status(400).json({
                    message:
                        'Geçerli bir mail kullanıcı adı girin.'
                });
            }

            if (password.length < 8) {
                return res.status(400).json({
                    message:
                        'Mail şifresi en az 8 karakter olmalıdır.'
                });
            }

            if (
                !Number.isInteger(quotaMb) ||
                quotaMb < 100 ||
                quotaMb > 10240
            ) {
                return res.status(400).json({
                    message:
                        'Mail kotası 100 MB ile 10240 MB arasında olmalıdır.'
                });
            }

            const email =
                `${username}@${mailDomain.domain}`
                    .toLowerCase();

            const existing =
                db.prepare(`
                    SELECT id
                    FROM mailboxes

                    WHERE service_id = ?
                      AND user_id = ?
                      AND LOWER(email) = LOWER(?)
                `).get(
                    service.id,
                    req.user.id,
                    email
                );

            if (existing) {
                return res.status(409).json({
                    message:
                        'Bu mail hesabı zaten mevcut.'
                });
            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            const result =
                db.prepare(`
                    INSERT INTO mailboxes (
                        user_id,
                        service_id,
                        email,
                        password_hash,
                        quota_mb,
                        status
                    )

                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    req.user.id,
                    service.id,
                    email,
                    passwordHash,
                    quotaMb,
                    'Aktif'
                );

            const mailbox =
                db.prepare(`
                    SELECT
                        id,
                        email,
                        quota_mb,
                        status,
                        created_at,
                        updated_at

                    FROM mailboxes

                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            logServiceAction(
                req.user.id,
                service.id,
                `E-posta hesabı oluşturuldu: ${email} (${quotaMb} MB)`
            );

            return res
                .status(201)
                .json({
                    message:
                        'Mail hesabı başarıyla oluşturuldu.',

                    mailbox
                });

        } catch (error) {
            console.error(
                'MAILBOX CREATE ERROR:',
                error
            );

            if (
                String(error.message)
                    .includes('UNIQUE')
            ) {
                return res.status(409).json({
                    message:
                        'Bu mail hesabı zaten mevcut.'
                });
            }

            return res.status(500).json({
                message:
                    'Mail hesabı oluşturulamadı.'
            });
        }
    }
);

app.patch(
    '/api/services/:serviceId/mailboxes/:mailboxId',

    authMiddleware,

    (req, res) => {
        try {
            const service =
                getOwnedMailService(
                    req.params.serviceId,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    message:
                        'Kurumsal mail hizmeti bulunamadı.'
                });
            }

            if (
                service.status ===
                'İptal Edildi'
            ) {
                return res.status(400).json({
                    message:
                        'İptal edilmiş hizmet üzerinde işlem yapılamaz.'
                });
            }

            const mailbox =
                db.prepare(`
                    SELECT *
                    FROM mailboxes

                    WHERE id = ?
                      AND service_id = ?
                      AND user_id = ?
                `).get(
                    Number(req.params.mailboxId),
                    service.id,
                    req.user.id
                );

            if (!mailbox) {
                return res.status(404).json({
                    message:
                        'Mail hesabı bulunamadı.'
                });
            }

            const quotaMb =
                Number(
                    req.body.quota_mb
                );

            if (
                !Number.isInteger(quotaMb) ||
                quotaMb < 100 ||
                quotaMb > 10240
            ) {
                return res.status(400).json({
                    message:
                        'Mail kotası 100 MB ile 10240 MB arasında olmalıdır.'
                });
            }

            db.prepare(`
                UPDATE mailboxes

                SET quota_mb = ?,
                    updated_at = CURRENT_TIMESTAMP

                WHERE id = ?
                  AND service_id = ?
                  AND user_id = ?
            `).run(
                quotaMb,
                mailbox.id,
                service.id,
                req.user.id
            );

            const updated =
                db.prepare(`
                    SELECT
                        id,
                        email,
                        quota_mb,
                        status,
                        created_at,
                        updated_at

                    FROM mailboxes

                    WHERE id = ?
                `).get(
                    mailbox.id
                );

            logServiceAction(
                req.user.id,
                service.id,
                `E-posta kotası güncellendi: ${mailbox.email} → ${quotaMb} MB`
            );

            return res.json({
                message:
                    'Mail kotası güncellendi.',

                mailbox:
                    updated
            });

        } catch (error) {
            console.error(
                'MAILBOX QUOTA ERROR:',
                error
            );

            return res.status(500).json({
                message:
                    'Mail kotası güncellenemedi.'
            });
        }
    }
);

app.patch(
    '/api/services/:serviceId/mailboxes/:mailboxId/password',

    authMiddleware,

    async (req, res) => {
        try {
            const service =
                getOwnedMailService(
                    req.params.serviceId,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    message:
                        'Kurumsal mail hizmeti bulunamadı.'
                });
            }

            if (
                service.status ===
                'İptal Edildi'
            ) {
                return res.status(400).json({
                    message:
                        'İptal edilmiş hizmet üzerinde işlem yapılamaz.'
                });
            }

            const mailbox =
                db.prepare(`
                    SELECT *
                    FROM mailboxes

                    WHERE id = ?
                      AND service_id = ?
                      AND user_id = ?
                `).get(
                    Number(req.params.mailboxId),
                    service.id,
                    req.user.id
                );

            if (!mailbox) {
                return res.status(404).json({
                    message:
                        'Mail hesabı bulunamadı.'
                });
            }

            const password =
                String(
                    req.body.password || ''
                );

            if (password.length < 8) {
                return res.status(400).json({
                    message:
                        'Yeni şifre en az 8 karakter olmalıdır.'
                });
            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            db.prepare(`
                UPDATE mailboxes

                SET password_hash = ?,
                    updated_at = CURRENT_TIMESTAMP

                WHERE id = ?
                  AND service_id = ?
                  AND user_id = ?
            `).run(
                passwordHash,
                mailbox.id,
                service.id,
                req.user.id
            );

            logServiceAction(
                req.user.id,
                service.id,
                `E-posta hesabı şifresi değiştirildi: ${mailbox.email}`
            );

            return res.json({
                message:
                    'Mail hesabı şifresi güncellendi.'
            });

        } catch (error) {
            console.error(
                'MAILBOX PASSWORD ERROR:',
                error
            );

            return res.status(500).json({
                message:
                    'Mail şifresi güncellenemedi.'
            });
        }
    }
);

app.delete(
    '/api/services/:serviceId/mailboxes/:mailboxId',

    authMiddleware,

    (req, res) => {
        try {
            const service =
                getOwnedMailService(
                    req.params.serviceId,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    message:
                        'Kurumsal mail hizmeti bulunamadı.'
                });
            }

            if (
                service.status ===
                'İptal Edildi'
            ) {
                return res.status(400).json({
                    message:
                        'İptal edilmiş hizmet üzerinde işlem yapılamaz.'
                });
            }

            const mailbox =
                db.prepare(`
                    SELECT *
                    FROM mailboxes

                    WHERE id = ?
                      AND service_id = ?
                      AND user_id = ?
                `).get(
                    Number(req.params.mailboxId),
                    service.id,
                    req.user.id
                );

            if (!mailbox) {
                return res.status(404).json({
                    message:
                        'Mail hesabı bulunamadı.'
                });
            }

            db.prepare(`
                DELETE FROM mailboxes

                WHERE id = ?
                  AND service_id = ?
                  AND user_id = ?
            `).run(
                mailbox.id,
                service.id,
                req.user.id
            );

            logServiceAction(
                req.user.id,
                service.id,
                `E-posta hesabı silindi: ${mailbox.email}`
            );

            return res.json({
                message:
                    'Mail hesabı silindi.'
            });

        } catch (error) {
            console.error(
                'MAILBOX DELETE ERROR:',
                error
            );

            return res.status(500).json({
                message:
                    'Mail hesabı silinemedi.'
            });
        }
    }
);

app.post(
    "/api/services/:id/logs",

    authMiddleware,

    (req, res) => {
        try {
            const serviceId =
                Number(req.params.id);

            const action =
                String(
                    req.body.action || ""
                )
                .trim();

            if (
                !Number.isInteger(serviceId) ||
                serviceId <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz hizmet ID."
                    });
            }

            if (
                !action ||
                action.length > 1000
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "İşlem açıklaması 1-1000 karakter arasında olmalıdır."
                    });
            }

            const service =
                db.prepare(`
                    SELECT id
                    FROM services
                    WHERE id = ?
                    AND user_id = ?
                `)
                .get(
                    serviceId,
                    req.user.id
                );

            if (!service) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Hizmet bulunamadı."
                    });
            }

            const written =
                logServiceAction(
                    req.user.id,
                    serviceId,
                    action
                );

            if (!written) {
                return res
                    .status(500)
                    .json({
                        success: false,
                        message:
                            "İşlem kaydı oluşturulamadı."
                    });
            }

            return res
                .status(201)
                .json({
                    success: true,
                    message:
                        "İşlem kaydı oluşturuldu."
                });

        } catch (error) {
            console.error(
                "SERVICE LOG CREATE ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "İşlem kaydı oluşturulamadı."
                });
        }
    }
);

app.get(
    "/api/services/:id/logs",

    authMiddleware,

    (req, res) => {
        try {
            const serviceId =
                Number(req.params.id);

            if (
                !Number.isInteger(serviceId) ||
                serviceId <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Geçersiz hizmet ID."
                    });
            }

            const service =
                db.prepare(`
                    SELECT id
                    FROM services
                    WHERE id = ?
                    AND user_id = ?
                `)
                .get(
                    serviceId,
                    req.user.id
                );

            if (!service) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Hizmet bulunamadı."
                    });
            }

            const logs =
                db.prepare(`
                    SELECT
                        id,
                        action,
                        created_at
                    FROM service_logs
                    WHERE service_id = ?
                    AND user_id = ?
                    ORDER BY id DESC
                `)
                .all(
                    serviceId,
                    req.user.id
                );

            return res.json({
                success: true,
                logs
            });

        } catch (error) {
            console.error(
                "SERVICE LOG LIST ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "İşlem kayıtları alınamadı."
                });
        }
    }
);
// ======================================================
// HOSTING FTP YÖNETİMİ
// ======================================================

function getOwnedHostingService(serviceId, userId) {
    return db.prepare(`
        SELECT *
        FROM services
        WHERE id = ?
          AND user_id = ?
          AND type = 'hosting'
    `).get(
        Number(serviceId),
        Number(userId)
    );
}


// ======================================================
// FTP HESAPLARINI LİSTELE
// GET /api/services/:id/ftp
// ======================================================

app.get(
    "/api/services/:id/ftp",
    authMiddleware,
    (req, res) => {
        try {
            const service =
                getOwnedHostingService(
                    req.params.id,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: "Hosting hizmeti bulunamadı."
                });
            }

            const accounts =
                db.prepare(`
                    SELECT
                        id,
                        username,
                        directory,
                        quota_mb,
                        status,
                        created_at,
                        updated_at
                    FROM ftp_accounts
                    WHERE service_id = ?
                      AND user_id = ?
                    ORDER BY id DESC
                `).all(
                    service.id,
                    req.user.id
                );

            return res.json({
                success: true,
                accounts
            });

        } catch (error) {
            console.error(
                "FTP LIST ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "FTP hesapları alınamadı."
            });
        }
    }
);


// ======================================================
// FTP HESABI OLUŞTUR
// POST /api/services/:id/ftp
// ======================================================

app.post(
    "/api/services/:id/ftp",
    authMiddleware,
    async (req, res) => {
        try {
            const service =
                getOwnedHostingService(
                    req.params.id,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hosting hizmeti bulunamadı."
                });
            }

            if (
                service.status ===
                "İptal Edildi"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "İptal edilmiş hosting üzerinde işlem yapılamaz."
                });
            }

            const username =
                String(
                    req.body.username || ""
                )
                .trim()
                .toLowerCase();

            const password =
                String(
                    req.body.password || ""
                );

            let directory =
                String(
                    req.body.directory ||
                    "/public_html"
                )
                .trim();

            const quotaMb =
                Number(
                    req.body.quota_mb ||
                    1024
                );

            const usernameRegex =
                /^[a-z0-9._-]{3,32}$/;

            if (
                !username ||
                !usernameRegex.test(
                    username
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "FTP kullanıcı adı 3-32 karakter olmalı ve sadece harf, rakam, nokta, tire veya alt çizgi içermelidir."
                });
            }

            if (
                password.length < 8
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "FTP şifresi en az 8 karakter olmalıdır."
                });
            }

            if (
                !Number.isInteger(quotaMb) ||
                quotaMb < 100 ||
                quotaMb > 102400
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "FTP kotası 100 MB ile 102400 MB arasında olmalıdır."
                });
            }

            if (
                !directory.startsWith("/")
            ) {
                directory =
                    "/" + directory;
            }

            if (
                directory.includes("..")
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz FTP dizini."
                });
            }

            const existing =
                db.prepare(`
                    SELECT id
                    FROM ftp_accounts
                    WHERE service_id = ?
                      AND user_id = ?
                      AND LOWER(username) =
                          LOWER(?)
                `).get(
                    service.id,
                    req.user.id,
                    username
                );

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Bu FTP kullanıcı adı zaten mevcut."
                });
            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            const result =
                db.prepare(`
                    INSERT INTO ftp_accounts (
                        user_id,
                        service_id,
                        username,
                        password_hash,
                        directory,
                        quota_mb,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    req.user.id,
                    service.id,
                    username,
                    passwordHash,
                    directory,
                    quotaMb,
                    "Aktif"
                );

            const account =
                db.prepare(`
                    SELECT
                        id,
                        username,
                        directory,
                        quota_mb,
                        status,
                        created_at,
                        updated_at
                    FROM ftp_accounts
                    WHERE id = ?
                `).get(
                    Number(
                        result.lastInsertRowid
                    )
                );

            logServiceAction(
                req.user.id,
                service.id,
                `FTP hesabı oluşturuldu: ${username}`
            );

            return res
                .status(201)
                .json({
                    success: true,
                    message:
                        "FTP hesabı oluşturuldu.",
                    account
                });

        } catch (error) {
            console.error(
                "FTP CREATE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "FTP hesabı oluşturulamadı."
            });
        }
    }
);


// ======================================================
// FTP KOTASI DEĞİŞTİR
// PATCH /api/services/:serviceId/ftp/:ftpId/quota
// ======================================================

app.patch(
    "/api/services/:serviceId/ftp/:ftpId/quota",
    authMiddleware,
    (req, res) => {
        try {
            const service =
                getOwnedHostingService(
                    req.params.serviceId,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hosting hizmeti bulunamadı."
                });
            }

            if (
                service.status ===
                "İptal Edildi"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "İptal edilmiş hosting üzerinde işlem yapılamaz."
                });
            }

            const ftpId =
                Number(
                    req.params.ftpId
                );

            const account =
                db.prepare(`
                    SELECT *
                    FROM ftp_accounts
                    WHERE id = ?
                      AND service_id = ?
                      AND user_id = ?
                `).get(
                    ftpId,
                    service.id,
                    req.user.id
                );

            if (!account) {
                return res.status(404).json({
                    success: false,
                    message:
                        "FTP hesabı bulunamadı."
                });
            }

            const quotaMb =
                Number(
                    req.body.quota_mb
                );

            if (
                !Number.isInteger(quotaMb) ||
                quotaMb < 100 ||
                quotaMb > 102400
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "FTP kotası geçersiz."
                });
            }

            db.prepare(`
                UPDATE ftp_accounts
                SET
                    quota_mb = ?,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
                  AND service_id = ?
                  AND user_id = ?
            `).run(
                quotaMb,
                ftpId,
                service.id,
                req.user.id
            );

            logServiceAction(
                req.user.id,
                service.id,
                `FTP kotası güncellendi: ${account.username} → ${quotaMb} MB`
            );

            return res.json({
                success: true,
                message:
                    "FTP kotası güncellendi."
            });

        } catch (error) {
            console.error(
                "FTP QUOTA ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "FTP kotası güncellenemedi."
            });
        }
    }
);


// ======================================================
// FTP DİZİNİ DEĞİŞTİR
// PATCH /api/services/:serviceId/ftp/:ftpId/directory
// ======================================================

app.patch(
    "/api/services/:serviceId/ftp/:ftpId/directory",
    authMiddleware,
    (req, res) => {
        try {
            const service =
                getOwnedHostingService(
                    req.params.serviceId,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hosting hizmeti bulunamadı."
                });
            }

            const ftpId =
                Number(
                    req.params.ftpId
                );

            const account =
                db.prepare(`
                    SELECT *
                    FROM ftp_accounts
                    WHERE id = ?
                      AND service_id = ?
                      AND user_id = ?
                `).get(
                    ftpId,
                    service.id,
                    req.user.id
                );

            if (!account) {
                return res.status(404).json({
                    success: false,
                    message:
                        "FTP hesabı bulunamadı."
                });
            }

            let directory =
                String(
                    req.body.directory || ""
                )
                .trim();

            if (!directory) {
                return res.status(400).json({
                    success: false,
                    message:
                        "FTP dizini boş olamaz."
                });
            }

            if (
                !directory.startsWith("/")
            ) {
                directory =
                    "/" + directory;
            }

            if (
                directory.includes("..")
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz FTP dizini."
                });
            }

            db.prepare(`
                UPDATE ftp_accounts
                SET
                    directory = ?,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
                  AND service_id = ?
                  AND user_id = ?
            `).run(
                directory,
                ftpId,
                service.id,
                req.user.id
            );

            logServiceAction(
                req.user.id,
                service.id,
                `FTP dizini güncellendi: ${account.username} → ${directory}`
            );

            return res.json({
                success: true,
                message:
                    "FTP dizini güncellendi."
            });

        } catch (error) {
            console.error(
                "FTP DIRECTORY ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "FTP dizini güncellenemedi."
            });
        }
    }
);


// ======================================================
// FTP ŞİFRESİ DEĞİŞTİR
// PATCH /api/services/:serviceId/ftp/:ftpId/password
// ======================================================

app.patch(
    "/api/services/:serviceId/ftp/:ftpId/password",
    authMiddleware,
    async (req, res) => {
        try {
            const service =
                getOwnedHostingService(
                    req.params.serviceId,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hosting hizmeti bulunamadı."
                });
            }

            const ftpId =
                Number(
                    req.params.ftpId
                );

            const account =
                db.prepare(`
                    SELECT *
                    FROM ftp_accounts
                    WHERE id = ?
                      AND service_id = ?
                      AND user_id = ?
                `).get(
                    ftpId,
                    service.id,
                    req.user.id
                );

            if (!account) {
                return res.status(404).json({
                    success: false,
                    message:
                        "FTP hesabı bulunamadı."
                });
            }

            const password =
                String(
                    req.body.password || ""
                );

            if (
                password.length < 8
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "FTP şifresi en az 8 karakter olmalıdır."
                });
            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            db.prepare(`
                UPDATE ftp_accounts
                SET
                    password_hash = ?,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
                  AND service_id = ?
                  AND user_id = ?
            `).run(
                passwordHash,
                ftpId,
                service.id,
                req.user.id
            );

            logServiceAction(
                req.user.id,
                service.id,
                `FTP şifresi değiştirildi: ${account.username}`
            );

            return res.json({
                success: true,
                message:
                    "FTP şifresi değiştirildi."
            });

        } catch (error) {
            console.error(
                "FTP PASSWORD ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "FTP şifresi değiştirilemedi."
            });
        }
    }
);


// ======================================================
// FTP HESABINI SİL
// DELETE /api/services/:serviceId/ftp/:ftpId
// ======================================================

app.delete(
    "/api/services/:serviceId/ftp/:ftpId",
    authMiddleware,
    (req, res) => {
        try {
            const service =
                getOwnedHostingService(
                    req.params.serviceId,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hosting hizmeti bulunamadı."
                });
            }

            const ftpId =
                Number(
                    req.params.ftpId
                );

            const account =
                db.prepare(`
                    SELECT *
                    FROM ftp_accounts
                    WHERE id = ?
                      AND service_id = ?
                      AND user_id = ?
                `).get(
                    ftpId,
                    service.id,
                    req.user.id
                );

            if (!account) {
                return res.status(404).json({
                    success: false,
                    message:
                        "FTP hesabı bulunamadı."
                });
            }

            db.prepare(`
                DELETE FROM ftp_accounts
                WHERE id = ?
                  AND service_id = ?
                  AND user_id = ?
            `).run(
                ftpId,
                service.id,
                req.user.id
            );

            logServiceAction(
                req.user.id,
                service.id,
                `FTP hesabı silindi: ${account.username}`
            );

            return res.json({
                success: true,
                message:
                    "FTP hesabı silindi."
            });

        } catch (error) {
            console.error(
                "FTP DELETE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "FTP hesabı silinemedi."
            });
        }
    }
);

// ======================================================
// HOSTING VERİTABANI YÖNETİMİ
// ======================================================


// ======================================================
// VERİTABANLARINI LİSTELE
// GET /api/services/:id/databases
// ======================================================

app.get(
    "/api/services/:id/databases",
    authMiddleware,
    (req, res) => {
        try {
            const service =
                getOwnedHostingService(
                    req.params.id,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: "Hosting hizmeti bulunamadı."
                });
            }

            const databases =
                db.prepare(`
                    SELECT
                        id,
                        database_name,
                        database_user,
                        status,
                        created_at,
                        updated_at
                    FROM hosting_databases
                    WHERE service_id = ?
                      AND user_id = ?
                    ORDER BY id DESC
                `).all(
                    service.id,
                    req.user.id
                );

            return res.json({
                success: true,
                databases
            });

        } catch (error) {
            console.error(
                "DATABASE LIST ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Veritabanları alınamadı."
            });
        }
    }
);


// ======================================================
// VERİTABANI OLUŞTUR
// POST /api/services/:id/databases
// ======================================================

app.post(
    "/api/services/:id/databases",
    authMiddleware,
    async (req, res) => {
        try {
            const service =
                getOwnedHostingService(
                    req.params.id,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hosting hizmeti bulunamadı."
                });
            }

            if (
                service.status ===
                "İptal Edildi"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "İptal edilmiş hosting üzerinde işlem yapılamaz."
                });
            }

            const databaseName =
                String(
                    req.body.database_name || ""
                )
                .trim()
                .toLowerCase();

            const databaseUser =
                String(
                    req.body.database_user || ""
                )
                .trim()
                .toLowerCase();

            const password =
                String(
                    req.body.password || ""
                );

            const nameRegex =
                /^[a-z0-9_]{3,32}$/;

            if (
                !nameRegex.test(
                    databaseName
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Veritabanı adı 3-32 karakter olmalı. Sadece harf, rakam ve alt çizgi kullanılabilir."
                });
            }

            if (
                !nameRegex.test(
                    databaseUser
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Veritabanı kullanıcısı geçersiz."
                });
            }

            if (
                password.length < 8
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Veritabanı şifresi en az 8 karakter olmalıdır."
                });
            }

            const existingDatabase =
                db.prepare(`
                    SELECT id
                    FROM hosting_databases
                    WHERE service_id = ?
                      AND database_name = ?
                `).get(
                    service.id,
                    databaseName
                );

            if (existingDatabase) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Bu veritabanı adı zaten kullanılıyor."
                });
            }

            const existingUser =
                db.prepare(`
                    SELECT id
                    FROM hosting_databases
                    WHERE service_id = ?
                      AND database_user = ?
                `).get(
                    service.id,
                    databaseUser
                );

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Bu veritabanı kullanıcısı zaten kullanılıyor."
                });
            }
// ======================================================
// DOMAIN SORGULAMA
// GELİŞTİRME MODU
// GET /api/domains/search?q=ornek
// ======================================================

app.get(
    "/api/domains/search",

    (req, res) => {
        try {
            const query =
                String(
                    req.query.q || ""
                )
                .trim();


            if (!query) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Domain adı girin."
                    });
            }


            if (
                query.length > 253
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Domain adı çok uzun."
                    });
            }


            const search =
                searchDomains(
                    query,
                    DOMAIN_PRICES
                );


            if (!search) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Geçerli bir domain adı girin."
                    });
            }


            return res.json({
                success:
                    true,

                mode:
                    search.mode,

                live:
                    search.live,

                message:
                    "Domain sorgusu tamamlandı.",

                warning:
                    "Gerçek registrar API henüz bağlı değil. Sonuçlar yalnızca ANAZHOSTING geliştirme veritabanına göre gösteriliyor.",

                results:
                    search.results
            });


        } catch (error) {
            console.error(
                "DOMAIN SEARCH ERROR:",
                error
            );


            return res
                .status(500)
                .json({
                    success:
                        false,

                    message:
                        "Domain sorgulanamadı."
                });
        }
    }
);
            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            const result =
                db.prepare(`
                    INSERT INTO hosting_databases (
                        user_id,
                        service_id,
                        database_name,
                        database_user,
                        password_hash,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    req.user.id,
                    service.id,
                    databaseName,
                    databaseUser,
                    passwordHash,
                    "Aktif"
                );

            const database =
                db.prepare(`
                    SELECT
                        id,
                        database_name,
                        database_user,
                        status,
                        created_at,
                        updated_at
                    FROM hosting_databases
                    WHERE id = ?
                `).get(
                    Number(
                        result.lastInsertRowid
                    )
                );

            logServiceAction(
                req.user.id,
                service.id,
                `Veritabanı oluşturuldu: ${databaseName} (${databaseUser})`
            );

            return res
                .status(201)
                .json({
                    success: true,
                    message:
                        "Veritabanı oluşturuldu.",
                    database
                });

        } catch (error) {
            console.error(
                "DATABASE CREATE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Veritabanı oluşturulamadı."
            });
        }
    }
);


// ======================================================
// VERİTABANI ŞİFRESİ DEĞİŞTİR
// PATCH /api/services/:serviceId/databases/:databaseId/password
// ======================================================
// ======================================================
// ŞİFRE SIFIRLAMA + E-POSTA DOĞRULAMA
// ======================================================
function addColumnIfMissing(
    tableName,
    columnName,
    columnDefinition
) {
    try {
        const columns =
            db.prepare(
                `PRAGMA table_info(${tableName})`
            ).all();

        const exists =
            columns.some(
                column =>
                    column.name === columnName
            );

        if (!exists) {
            db.exec(`
                ALTER TABLE ${tableName}
                ADD COLUMN ${columnName} ${columnDefinition}
            `);

            console.log(
                `DB: ${tableName}.${columnName} eklendi.`
            );
        }

    } catch (error) {
        console.error(
            `ADD COLUMN ERROR (${tableName}.${columnName}):`,
            error
        );

        throw error;
    }
}

addColumnIfMissing(
    'users',
    'email_verified',
    'INTEGER NOT NULL DEFAULT 0'
);

db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS
        idx_password_reset_codes_user
    ON password_reset_codes(user_id);

    CREATE TABLE IF NOT EXISTS email_verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS
        idx_email_verification_codes_user
    ON email_verification_codes(user_id);
`);
app.patch(
    "/api/services/:serviceId/databases/:databaseId/password",
    authMiddleware,
    async (req, res) => {
        try {
            const service =
                getOwnedHostingService(
                    req.params.serviceId,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hosting hizmeti bulunamadı."
                });
            }

            const databaseId =
                Number(
                    req.params.databaseId
                );

            const database =
                db.prepare(`
                    SELECT *
                    FROM hosting_databases
                    WHERE id = ?
                      AND service_id = ?
                      AND user_id = ?
                `).get(
                    databaseId,
                    service.id,
                    req.user.id
                );

            if (!database) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Veritabanı bulunamadı."
                });
            }

            const password =
                String(
                    req.body.password || ""
                );

            if (
                password.length < 8
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Yeni şifre en az 8 karakter olmalıdır."
                });
            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            db.prepare(`
                UPDATE hosting_databases
                SET
                    password_hash = ?,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
                  AND service_id = ?
                  AND user_id = ?
            `).run(
                passwordHash,
                databaseId,
                service.id,
                req.user.id
            );

            logServiceAction(
                req.user.id,
                service.id,
                `Veritabanı şifresi değiştirildi: ${database.database_name}`
            );

            return res.json({
                success: true,
                message:
                    "Veritabanı şifresi değiştirildi."
            });

        } catch (error) {
            console.error(
                "DATABASE PASSWORD ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Veritabanı şifresi değiştirilemedi."
            });
        }
    }
);


// ======================================================
// VERİTABANI SİL
// DELETE /api/services/:serviceId/databases/:databaseId
// ======================================================

app.delete(
    "/api/services/:serviceId/databases/:databaseId",
    authMiddleware,
    (req, res) => {
        try {
            const service =
                getOwnedHostingService(
                    req.params.serviceId,
                    req.user.id
                );

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hosting hizmeti bulunamadı."
                });
            }

            const databaseId =
                Number(
                    req.params.databaseId
                );

            const database =
                db.prepare(`
                    SELECT *
                    FROM hosting_databases
                    WHERE id = ?
                      AND service_id = ?
                      AND user_id = ?
                `).get(
                    databaseId,
                    service.id,
                    req.user.id
                );

            if (!database) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Veritabanı bulunamadı."
                });
            }

            db.prepare(`
                DELETE FROM hosting_databases
                WHERE id = ?
                  AND service_id = ?
                  AND user_id = ?
            `).run(
                databaseId,
                service.id,
                req.user.id
            );

            logServiceAction(
                req.user.id,
                service.id,
                `Veritabanı silindi: ${database.database_name}`
            );

            return res.json({
                success: true,
                message:
                    "Veritabanı silindi."
            });

        } catch (error) {
            console.error(
                "DATABASE DELETE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Veritabanı silinemedi."
            });
        }
    }
);
// ======================================================
// AUTH CODE HELPERS
// ======================================================

function generateSixDigitCode() {
    return String(
        crypto.randomInt(
            100000,
            1000000
        )
    );
}

function hashAuthCode(code) {
    return crypto
        .createHash('sha256')
        .update(String(code))
        .digest('hex');
}

function getFutureDate(minutes) {
    return new Date(
        Date.now() +
        Number(minutes) * 60 * 1000
    )
        .toISOString()
        .replace('T', ' ')
        .replace('Z', '');
}

function normalizeEmail(email) {
    return String(email || '')
        .trim()
        .toLowerCase();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}

function createMailTransporter() {
    const host =
        process.env.SMTP_HOST;

    const user =
        process.env.SMTP_USER;

    const pass =
        process.env.SMTP_PASS;

    if (
        !host ||
        !user ||
        !pass
    ) {
        return null;
    }

    return nodemailer.createTransport({
        host,

        port:
            Number(
                process.env.SMTP_PORT ||
                587
            ),

        secure:
            String(
                process.env.SMTP_SECURE
            ).toLowerCase() ===
            'true',

        auth: {
            user,
            pass
        }
    });
}

async function sendAuthEmail({
    to,
    subject,
    title,
    code,
    description
}) {
    const transporter =
        createMailTransporter();

    if (!transporter) {
        console.log(
            '\n================================='
        );

        console.log(
            'ANAZHOSTING DEV MAIL'
        );

        console.log(
            'Alıcı:',
            to
        );

        console.log(
            'Konu:',
            subject
        );

        console.log(
            'Kod:',
            code
        );

        console.log(
            '=================================\n'
        );

        return {
            success: true,
            development: true
        };
    }

    await transporter.sendMail({
        from:
            process.env.SMTP_FROM ||
            'ANAZHOSTING <noreply@anazhosting.com.tr>',

        to,

        subject,

        text:
            `${title}\n\n` +
            `${description}\n\n` +
            `Kodunuz: ${code}\n\n` +
            `Bu kod kısa süre içinde geçerliliğini kaybedecektir.`,

        html: `
            <div
                style="
                    font-family:Arial,sans-serif;
                    background:#f8fafc;
                    padding:40px 20px;
                "
            >
                <div
                    style="
                        max-width:520px;
                        margin:auto;
                        background:white;
                        border:1px solid #e2e8f0;
                        border-radius:18px;
                        padding:32px;
                    "
                >
                    <h2
                        style="
                            margin:0 0 12px;
                            color:#0f172a;
                        "
                    >
                        ${title}
                    </h2>

                    <p
                        style="
                            color:#64748b;
                            line-height:1.6;
                        "
                    >
                        ${description}
                    </p>

                    <div
                        style="
                            font-size:32px;
                            letter-spacing:8px;
                            font-weight:bold;
                            text-align:center;
                            padding:20px;
                            margin:24px 0;
                            background:#f0f9ff;
                            border-radius:14px;
                            color:#0284c7;
                        "
                    >
                        ${code}
                    </div>

                    <p
                        style="
                            color:#94a3b8;
                            font-size:12px;
                            line-height:1.6;
                        "
                    >
                        Bu kod kısa süre içinde
                        geçerliliğini kaybedecektir.
                        Bu işlemi siz yapmadıysanız
                        bu e-postayı yok sayabilirsiniz.
                    </p>
                </div>
            </div>
        `
    });

    return {
        success: true,
        development: false
    };
}


// ======================================================
// ŞİFREMİ UNUTTUM - KOD GÖNDER
// ======================================================

app.post(
    '/api/auth/forgot-password',
    async (req, res) => {

        try {
            const email =
                normalizeEmail(
                    req.body?.email
                );

            if (
                !email ||
                !isValidEmail(email)
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            'Geçerli bir e-posta adresi girin.'
                    });
            }

            const user =
                db.prepare(`
                    SELECT
                        id,
                        name,
                        email
                    FROM users
                    WHERE LOWER(email) = ?
                `).get(email);

            /*
                Kullanıcının kayıtlı olup olmadığını
                dışarı belli etmiyoruz.
            */
            if (!user) {
                return res.json({
                    success: true,
                    message:
                        'E-posta kayıtlıysa sıfırlama kodu gönderildi.'
                });
            }

            db.prepare(`
                UPDATE password_reset_codes
                SET used = 1
                WHERE user_id = ?
                  AND used = 0
            `).run(
                user.id
            );

            const code =
                generateSixDigitCode();

            const codeHash =
                hashAuthCode(code);

            const expiresAt =
                getFutureDate(15);

            db.prepare(`
                INSERT INTO password_reset_codes (
                    user_id,
                    code_hash,
                    expires_at
                )
                VALUES (?, ?, ?)
            `).run(
                user.id,
                codeHash,
                expiresAt
            );

            await sendAuthEmail({
                to:
                    user.email,

                subject:
                    'ANAZHOSTING - Şifre Sıfırlama',

                title:
                    'Şifre Sıfırlama',

                code,

                description:
                    'ANAZHOSTING hesabınızın şifresini sıfırlamak için aşağıdaki kodu kullanın.'
            });

            return res.json({
                success: true,

                message:
                    'E-posta kayıtlıysa sıfırlama kodu gönderildi.'
            });

        } catch (error) {
            console.error(
                'FORGOT PASSWORD ERROR:',
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        'Şifre sıfırlama işlemi başlatılamadı.'
                });
        }
    }
);


// ======================================================
// ŞİFRE SIFIRLAMA
// ======================================================

app.post(
    '/api/auth/reset-password',
    async (req, res) => {

        try {
            const email =
                normalizeEmail(
                    req.body?.email
                );

            const code =
                String(
                    req.body?.code ||
                    ''
                ).trim();

            const newPassword =
                String(
                    req.body?.new_password ||
                    ''
                );

            if (
                !email ||
                !isValidEmail(email)
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            'Geçerli bir e-posta adresi girin.'
                    });
            }

            if (
                !/^\d{6}$/.test(code)
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            'Doğrulama kodu 6 haneli olmalıdır.'
                    });
            }

            if (
                newPassword.length < 8
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            'Yeni şifre en az 8 karakter olmalıdır.'
                    });
            }

            const user =
                db.prepare(`
                    SELECT
                        id,
                        email
                    FROM users
                    WHERE LOWER(email) = ?
                `).get(email);

            if (!user) {
                return res
                    .status(400)
                    .json({
                        message:
                            'Kod geçersiz veya süresi dolmuş.'
                    });
            }

            const resetRecord =
                db.prepare(`
                    SELECT *
                    FROM password_reset_codes
                    WHERE user_id = ?
                      AND used = 0
                    ORDER BY id DESC
                    LIMIT 1
                `).get(
                    user.id
                );

            if (!resetRecord) {
                return res
                    .status(400)
                    .json({
                        message:
                            'Kod geçersiz veya süresi dolmuş.'
                    });
            }

            const expires =
                new Date(
                    String(
                        resetRecord.expires_at
                    ).replace(
                        ' ',
                        'T'
                    )
                );

            if (
                Number.isNaN(
                    expires.getTime()
                ) ||
                expires.getTime() <
                    Date.now()
            ) {
                db.prepare(`
                    UPDATE password_reset_codes
                    SET used = 1
                    WHERE id = ?
                `).run(
                    resetRecord.id
                );

                return res
                    .status(400)
                    .json({
                        message:
                            'Kodun süresi dolmuş.'
                    });
            }

            const submittedHash =
                hashAuthCode(code);

            if (
                submittedHash !==
                resetRecord.code_hash
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            'Kod geçersiz.'
                    });
            }

            const newPasswordHash =
                await bcrypt.hash(
                    newPassword,
                    12
                );

            const transaction =
                db.transaction(() => {

                    db.prepare(`
                        UPDATE users
                        SET password = ?
                        WHERE id = ?
                    `).run(
                        newPasswordHash,
                        user.id
                    );

                    db.prepare(`
                        UPDATE password_reset_codes
                        SET used = 1
                        WHERE user_id = ?
                    `).run(
                        user.id
                    );
                });

            transaction();

            return res.json({
                success: true,

                message:
                    'Şifreniz başarıyla değiştirildi.'
            });

        } catch (error) {
            console.error(
                'RESET PASSWORD ERROR:',
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        'Şifre değiştirilemedi.'
                });
        }
    }
);

// ======================================================
// E-POSTA DOĞRULAMA KODU GÖNDER
// ======================================================

app.post(
    '/api/auth/send-verification',
    authMiddleware,
    async (req, res) => {

        try {
            const user =
                db.prepare(`
                    SELECT
                        id,
                        name,
                        email,
                        email_verified
                    FROM users
                    WHERE id = ?
                `).get(
                    req.user.id
                );

            if (!user) {
                return res
                    .status(404)
                    .json({
                        message:
                            'Kullanıcı bulunamadı.'
                    });
            }

            if (
                Number(
                    user.email_verified
                ) === 1
            ) {
                return res.json({
                    success: true,

                    alreadyVerified: true,

                    message:
                        'E-posta adresiniz zaten doğrulanmış.'
                });
            }

            db.prepare(`
                UPDATE email_verification_codes
                SET used = 1
                WHERE user_id = ?
                  AND used = 0
            `).run(
                user.id
            );

            const code =
                generateSixDigitCode();

            const codeHash =
                hashAuthCode(code);

            const expiresAt =
                getFutureDate(15);

            db.prepare(`
                INSERT INTO email_verification_codes (
                    user_id,
                    code_hash,
                    expires_at
                )
                VALUES (?, ?, ?)
            `).run(
                user.id,
                codeHash,
                expiresAt
            );

            await sendAuthEmail({
                to:
                    user.email,

                subject:
                    'ANAZHOSTING - E-posta Doğrulama',

                title:
                    'E-posta Adresinizi Doğrulayın',

                code,

                description:
                    'ANAZHOSTING hesabınızı doğrulamak için aşağıdaki 6 haneli kodu kullanın.'
            });

            return res.json({
                success: true,

                message:
                    'Doğrulama kodu gönderildi.'
            });

        } catch (error) {
            console.error(
                'SEND VERIFICATION ERROR:',
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        'Doğrulama kodu gönderilemedi.'
                });
        }
    }
);


// ======================================================
// E-POSTA DOĞRULA
// ======================================================

app.post(
    '/api/auth/verify-email',
    authMiddleware,
    async (req, res) => {

        try {
            const code =
                String(
                    req.body?.code ||
                    ''
                ).trim();

            if (
                !/^\d{6}$/.test(code)
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            'Doğrulama kodu 6 haneli olmalıdır.'
                    });
            }

            const user =
                db.prepare(`
                    SELECT
                        id,
                        email,
                        email_verified
                    FROM users
                    WHERE id = ?
                `).get(
                    req.user.id
                );

            if (!user) {
                return res
                    .status(404)
                    .json({
                        message:
                            'Kullanıcı bulunamadı.'
                    });
            }

            if (
                Number(
                    user.email_verified
                ) === 1
            ) {
                return res.json({
                    success: true,

                    message:
                        'E-posta adresiniz zaten doğrulanmış.'
                });
            }

            const verifyRecord =
                db.prepare(`
                    SELECT *
                    FROM email_verification_codes
                    WHERE user_id = ?
                      AND used = 0
                    ORDER BY id DESC
                    LIMIT 1
                `).get(
                    user.id
                );

            if (!verifyRecord) {
                return res
                    .status(400)
                    .json({
                        message:
                            'Doğrulama kodu geçersiz.'
                    });
            }

            const expires =
                new Date(
                    String(
                        verifyRecord.expires_at
                    ).replace(
                        ' ',
                        'T'
                    )
                );

            if (
                Number.isNaN(
                    expires.getTime()
                ) ||
                expires.getTime() <
                    Date.now()
            ) {
                db.prepare(`
                    UPDATE email_verification_codes
                    SET used = 1
                    WHERE id = ?
                `).run(
                    verifyRecord.id
                );

                return res
                    .status(400)
                    .json({
                        message:
                            'Doğrulama kodunun süresi dolmuş.'
                    });
            }

            const submittedHash =
                hashAuthCode(code);

            if (
                submittedHash !==
                verifyRecord.code_hash
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            'Doğrulama kodu yanlış.'
                    });
            }

            const transaction =
                db.transaction(() => {

                    db.prepare(`
                        UPDATE users
                        SET email_verified = 1
                        WHERE id = ?
                    `).run(
                        user.id
                    );

                    db.prepare(`
                        UPDATE email_verification_codes
                        SET used = 1
                        WHERE user_id = ?
                    `).run(
                        user.id
                    );
                });

            transaction();

            return res.json({
                success: true,

                email_verified: true,

                message:
                    'E-posta adresiniz başarıyla doğrulandı.'
            });

        } catch (error) {
            console.error(
                'VERIFY EMAIL ERROR:',
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        'E-posta doğrulanamadı.'
                });
        }
    }
);

// ======================================================
// OTURUMDAKİ KULLANICI
// ======================================================

// ======================================================
// 404 - BULUNAMAYAN ENDPOINT
// ======================================================

app.use(
    (req, res) => {

        return res
            .status(404)
            .json({
                success: false,
                message:
                    "İstenen API adresi bulunamadı."
            });
    }
);


// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "GLOBAL API ERROR:",
            error
        );


        if (
            error?.type ===
            "entity.too.large"
        ) {
            return res
                .status(413)
                .json({
                    success: false,
                    message:
                        "Gönderilen veri çok büyük."
                });
        }


        if (
            error?.type ===
            "entity.parse.failed"
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Geçersiz JSON verisi."
                });
        }


        if (
            res.headersSent
        ) {
            return next(
                error
            );
        }


        return res
            .status(500)
            .json({
                success: false,
                message:
                    "Sunucuda beklenmeyen bir hata oluştu."
            });
    }
);

app.get(
    '/api/auth/me',
    authMiddleware,
    (req, res) => {

        try {
            const user =
                db.prepare(`
                    SELECT
                        id,
                        name,
                        email,
                        role,
                        email_verified,
                        created_at
                    FROM users
                    WHERE id = ?
                `).get(
                    req.user.id
                );

            if (!user) {
                return res
                    .status(404)
                    .json({
                        message:
                            'Kullanıcı bulunamadı.'
                    });
            }

            return res.json({
                success: true,

                user: {
                    id:
                        user.id,

                    name:
                        user.name,

                    email:
                        user.email,

                    role:
                        user.role,

                    email_verified:
                        Number(
                            user.email_verified
                        ) === 1,

                    created_at:
                        user.created_at
                }
            });

        } catch (error) {
            console.error(
                'AUTH ME ERROR:',
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        'Kullanıcı bilgileri alınamadı.'
                });
        }
    }
);

app.listen(
    PORT,

    () => {
        console.log(
            "=========================================="
        );

        console.log(
            "ANAZHOSTING BACKEND ÇALIŞIYOR"
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            "=========================================="
        );
    }
);