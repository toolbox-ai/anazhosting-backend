const axios =
    require("axios");


const WHM_HOST =
    String(
        process.env.WHM_HOST || ""
    )
    .trim()
    .replace(/\/+$/, "");


const WHM_USERNAME =
    String(
        process.env.WHM_USERNAME || ""
    )
    .trim();


const WHM_API_TOKEN =
    String(
        process.env.WHM_API_TOKEN || ""
    )
    .trim();


function isWhmConfigured() {
    return Boolean(
        WHM_HOST &&
        WHM_USERNAME &&
        WHM_API_TOKEN
    );
}


function requireWhmConfig() {
    if (!isWhmConfigured()) {
        const error =
            new Error(
                "WHM bağlantı bilgileri .env içinde eksik."
            );

        error.code =
            "WHM_NOT_CONFIGURED";

        throw error;
    }
}


const whmClient =
    axios.create({
        timeout:
            20000,

        headers: {
            Accept:
                "application/json"
        },

        validateStatus:
            () => true
    });


async function whmRequest(
    endpoint,
    params = {}
) {
    requireWhmConfig();

    const cleanEndpoint =
        String(endpoint || "")
        .replace(
            /^\/+/,
            ""
        );

    const url =
        `${WHM_HOST}/json-api/${cleanEndpoint}`;

    let response;

    try {
        response =
            await whmClient.get(
                url,
                {
                    params: {
                        "api.version":
                            1,

                        ...params
                    },

                    headers: {
                        Authorization:
                            `whm ${WHM_USERNAME}:${WHM_API_TOKEN}`
                    }
                }
            );

    } catch (error) {
        const connectionError =
            new Error(
                "WHM sunucusuna bağlanılamadı."
            );

        connectionError.code =
            "WHM_CONNECTION_ERROR";

        connectionError.cause =
            error;

        throw connectionError;
    }

    if (
        response.status < 200 ||
        response.status >= 300
    ) {
        const error =
            new Error(
                `WHM HTTP hatası: ${response.status}`
            );

        error.code =
            "WHM_HTTP_ERROR";

        error.status =
            response.status;

        throw error;
    }

    const data =
        response.data;

    if (
        data &&
        data.metadata &&
        Number(
            data.metadata.result
        ) === 0
    ) {
        const reason =
            data.metadata.reason ||
            "WHM işlemi başarısız.";

        const error =
            new Error(
                reason
            );

        error.code =
            "WHM_API_ERROR";

        error.whmResponse =
            data;

        throw error;
    }

    return data;
}


async function testWhmConnection() {
    const data =
        await whmRequest(
            "version"
        );

    return {
        success:
            true,

        configured:
            true,

        version:
            data?.data?.version ||
            data?.version ||
            null
    };
}


async function createCpanelAccount({
    username,
    domain,
    password,
    email,
    plan
}) {
    const cleanUsername =
        String(
            username || ""
        )
        .trim()
        .toLowerCase();

    const cleanDomain =
        String(
            domain || ""
        )
        .trim()
        .toLowerCase();

    const cleanEmail =
        String(
            email || ""
        )
        .trim()
        .toLowerCase();

    const cleanPlan =
        String(
            plan || ""
        )
        .trim();

    if (
        !/^[a-z][a-z0-9]{2,15}$/.test(
            cleanUsername
        )
    ) {
        throw new Error(
            "Geçersiz cPanel kullanıcı adı."
        );
    }

    if (
        cleanDomain.length < 3 ||
        cleanDomain.length > 253 ||
        !cleanDomain.includes(".")
    ) {
        throw new Error(
            "Geçersiz domain."
        );
    }

    if (
        typeof password !==
            "string" ||
        password.length < 12 ||
        password.length > 128
    ) {
        throw new Error(
            "cPanel şifresi en az 12 karakter olmalıdır."
        );
    }

    if (
        !cleanEmail ||
        !cleanEmail.includes("@")
    ) {
        throw new Error(
            "Geçersiz e-posta adresi."
        );
    }

    if (!cleanPlan) {
        throw new Error(
            "WHM paket adı belirtilmedi."
        );
    }

    return await whmRequest(
        "createacct",
        {
            username:
                cleanUsername,

            domain:
                cleanDomain,

            password,

            contactemail:
                cleanEmail,

            plan:
                cleanPlan
        }
    );
}


async function suspendCpanelAccount(
    username,
    reason =
        "ANAZHOSTING tarafından askıya alındı."
) {
    return await whmRequest(
        "suspendacct",
        {
            user:
                String(username)
                .trim(),

            reason:
                String(reason)
                .slice(
                    0,
                    255
                )
        }
    );
}


async function unsuspendCpanelAccount(
    username
) {
    return await whmRequest(
        "unsuspendacct",
        {
            user:
                String(username)
                .trim()
        }
    );
}


async function removeCpanelAccount(
    username
) {
    return await whmRequest(
        "removeacct",
        {
            username:
                String(username)
                .trim(),

            keepdns:
                0
        }
    );
}


async function getCpanelAccount(
    username
) {
    const data =
        await whmRequest(
            "listaccts",
            {
                search:
                    String(username)
                    .trim(),

                searchtype:
                    "user"
            }
        );

    const accounts =
        Array.isArray(
            data?.data?.acct
        )
            ? data.data.acct
            : [];

    return (
        accounts.find(
            account =>
                String(
                    account.user || ""
                ) ===
                String(
                    username || ""
                )
        ) ||
        null
    );
}


module.exports = {
    isWhmConfigured,
    testWhmConnection,
    createCpanelAccount,
    suspendCpanelAccount,
    unsuspendCpanelAccount,
    removeCpanelAccount,
    getCpanelAccount
};