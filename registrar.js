const db =
    require("./database");


function getSupportedExtensions(
    domainPrices
) {
    return Object
        .keys(
            domainPrices || {}
        )
        .sort(
            (a, b) =>
                b.length - a.length
        );
}


function normalizeDomainBase(
    input,
    domainPrices
) {
    let value =
        String(
            input || ""
        )
        .trim()
        .toLowerCase();

    value =
        value
            .replace(
                /^https?:\/\//,
                ""
            )
            .replace(
                /^www\./,
                ""
            )
            .split("/")[0]
            .replace(
                /\.+$/,
                ""
            );

    if (
        !value ||
        value.length > 253
    ) {
        return null;
    }

    const extensions =
        getSupportedExtensions(
            domainPrices
        );

    const matchedExtension =
        extensions.find(
            extension =>
                value.endsWith(
                    extension
                )
        );

    if (matchedExtension) {
        value =
            value.slice(
                0,
                -matchedExtension.length
            );
    }

    /*
     * Kullanıcı örneğin:
     * site.xyz
     * yazarsa ilk kısmı alıyoruz.
     */
    if (
        value.includes(".")
    ) {
        value =
            value.split(".")[0];
    }

    if (
        value.length < 2 ||
        value.length > 63
    ) {
        return null;
    }

    /*
     * Şimdilik ASCII domain.
     * Türkçe karakter / IDN desteğini
     * registrar API bağlarken ekleyeceğiz.
     */
    const labelRegex =
        /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

    if (
        !labelRegex.test(
            value
        )
    ) {
        return null;
    }

    return value;
}


function normalizeFullDomain(
    domain
) {
    const value =
        String(
            domain || ""
        )
        .trim()
        .toLowerCase()
        .replace(
            /^https?:\/\//,
            ""
        )
        .replace(
            /^www\./,
            ""
        )
        .split("/")[0]
        .replace(
            /\.+$/,
            ""
        );

    if (
        !value ||
        value.length > 253
    ) {
        return null;
    }

    const labels =
        value.split(".");

    if (
        labels.length < 2
    ) {
        return null;
    }

    const labelRegex =
        /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

    if (
        labels.some(
            label =>
                !labelRegex.test(
                    label
                )
        )
    ) {
        return null;
    }

    return value;
}


function getMatchedExtension(
    domain,
    domainPrices
) {
    const cleanDomain =
        normalizeFullDomain(
            domain
        );

    if (!cleanDomain) {
        return null;
    }

    return getSupportedExtensions(
        domainPrices
    )
    .find(
        extension =>
            cleanDomain.endsWith(
                extension
            )
    ) || null;
}


function isDomainLocallyTaken(
    domain
) {
    const cleanDomain =
        normalizeFullDomain(
            domain
        );

    if (!cleanDomain) {
        return true;
    }

    const existing =
        db.prepare(`
            SELECT id
            FROM services
            WHERE type = 'domain'
              AND LOWER(name) = LOWER(?)
              AND status != 'İptal Edildi'
            LIMIT 1
        `)
        .get(
            cleanDomain
        );

    return Boolean(
        existing
    );
}


function checkLocalDomain(
    domain,
    domainPrices
) {
    const cleanDomain =
        normalizeFullDomain(
            domain
        );

    if (!cleanDomain) {
        return {
            valid:
                false,
            available:
                false,
            domain:
                null,
            price:
                null,
            extension:
                null
        };
    }

    const extension =
        getMatchedExtension(
            cleanDomain,
            domainPrices
        );

    if (!extension) {
        return {
            valid:
                false,
            available:
                false,
            domain:
                cleanDomain,
            price:
                null,
            extension:
                null
        };
    }

    const taken =
        isDomainLocallyTaken(
            cleanDomain
        );

    return {
        valid:
            true,
        available:
            !taken,
        domain:
            cleanDomain,
        extension:
            extension,
        price:
            Number(
                domainPrices[
                    extension
                ]
            ),

        /*
         * Şu anda gerçek registrar
         * sorgusu yapılmıyor.
         */
        liveChecked:
            false,
        source:
            "local"
    };
}


function searchDomains(
    input,
    domainPrices
) {
    const base =
        normalizeDomainBase(
            input,
            domainPrices
        );

    if (!base) {
        return null;
    }

    const extensions =
        Object.keys(
            domainPrices
        );

    const results =
        extensions.map(
            extension => {
                const domain =
                    `${base}${extension}`;

                return checkLocalDomain(
                    domain,
                    domainPrices
                );
            }
        );

    return {
        query:
            base,
        live:
            false,
        mode:
            "mock",
        results:
            results
    };
}


module.exports = {
    normalizeDomainBase,
    normalizeFullDomain,
    getMatchedExtension,
    isDomainLocallyTaken,
    checkLocalDomain,
    searchDomains
};