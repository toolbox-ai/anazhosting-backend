    let cart = [];
    let currentUser = null;
    let userServices = [];
    let userInvoices = [];

    let currentBillingPeriod = 'ay';

    // Yenileme
    let renewingServiceIndex = null;
    let renewingServiceId = null;
    let renewSelectedPeriod = 'ay';

    let resetTargetEmail = null;
    let passwordResetToken = '';
    let generatedCode = null;
    let isChatOpen = false;
    let currentLang = localStorage.getItem('vortex_lang') || 'tr';
    // ======================================================
    // SSL YÖNETİMİ
    // ======================================================

    let currentSslServiceIndex = null;
    let currentSslData = null;



    // Ziyaretçi ID yönetimi
    let currentUserId = localStorage.getItem('vortex_user_id');

    if (!currentUserId) {
        currentUserId =
            'Ziyaretçi #' +
            Math.floor(1000 + Math.random() * 9000);

        localStorage.setItem(
            'vortex_user_id',
            currentUserId
        );
    }

    const hostingPlans = [
        {
            name: 'Giriş Paketi',
            monthly: 29.90,
            yearly: 299.00,
            features: [
                '1 Web Sitesi',
                '5 GB NVME',
                '25 GB Trafik',
                'Ücretsiz SSL'
            ]
        },
        {
            name: 'Giriş Plus Paketi',
            monthly: 39.90,
            yearly: 399.00,
            features: [
                '1 Web Sitesi',
                '25 GB NVME',
                '75 GB Trafik',
                'Ücretsiz SSL'
            ]
        },
        {
            name: 'Uzman Paketi',
            monthly: 79.90,
            yearly: 799.00,
            features: [
                '1 Web Sitesi',
                'Limitsiz Disk',
                'Limitsiz Trafik',
                'Ücretsiz SSL'
            ]
        },
        {
            name: 'Limitsiz Plus Paketi',
            monthly: 99.90,
            yearly: 999.00,
            features: [
                '2 Web Sitesi',
                'Limitsiz Disk',
                'Limitsiz Trafik',
                'Ücretsiz SSL'
            ],
            popular: true
        },
        {
            name: 'Limitsiz Pro Paketi',
            monthly: 119.90,
            yearly: 1199.00,
            features: [
                'Limitsiz Site',
                'Limitsiz Disk',
                'Limitsiz Trafik',
                'Ücretsiz SSL'
            ]
        }
    ];

    const sslPlans = [
        {
            name: 'Standart SSL (DV)',
            monthly: 49.90,
            yearly: 499.00,
            features: [
                'Tek Domain',
                '256-bit Şifreleme',
                '10.000 ₺ Garanti',
                'Hızlı Kurulum'
            ]
        },
        {
            name: 'Positive SSL',
            monthly: 89.90,
            yearly: 899.00,
            features: [
                'Tek Domain',
                '256-bit Şifreleme',
                '50.000 ₺ Garanti',
                'Mobil Uyumlu'
            ],
            popular: true
        },
        {
            name: 'Multi-Domain SSL',
            monthly: 149.90,
            yearly: 1499.00,
            features: [
                '5 Domain',
                '256-bit Şifreleme',
                '100.000 ₺ Garanti',
                'SAN Desteği'
            ]
        },
        {
            name: 'Wildcard SSL',
            monthly: 199.90,
            yearly: 1999.00,
            features: [
                'Sınırsız Alt Domain (*.site.com)',
                '256-bit Şifreleme',
                '100.000 ₺ Garanti',
                'Öncelikli Destek'
            ]
        }
    ];

    const emailPlans = [
        {
            name: 'Kurumsal Mail - Başlangıç',
            monthly: 39.90,
            yearly: 399.00,
            features: [
                '5 E-Posta Hesabı',
                '10 GB Depolama',
                'Webmail Erişimi',
                'Spam Koruması'
            ]
        },
        {
            name: 'Kurumsal Mail - Standart',
            monthly: 69.90,
            yearly: 699.00,
            features: [
                '15 E-Posta Hesabı',
                '25 GB Depolama',
                'Mobil Erişim',
                'Takvim & Kişiler'
            ],
            popular: true
        },
        {
            name: 'Kurumsal Mail - Profesyonel',
            monthly: 99.90,
            yearly: 999.00,
            features: [
                'Sınırsız E-Posta',
                '50 GB Depolama',
                'Outlook / IMAP Desteği',
                'Gelişmiş Filtreleme'
            ]
        },
        {
            name: 'Kurumsal Mail - Kurumsal',
            monthly: 149.90,
            yearly: 1499.00,
            features: [
                'Sınırsız E-Posta',
                '100 GB Depolama',
                'Özel Domain',
                'Öncelikli Destek'
            ]
        }
    ];

    const vdsPlans = [
        {
            name: 'VDS Başlangıç (2 GB RAM)',
            monthly: 199.90,
            yearly: 1999.00,
            features: [
                '2 GB RAM',
                '1 VCPU',
                '50 GB NVMe Disk',
                '1 Gbps Port / 1 TB Trafik'
            ]
        },
        {
            name: 'VDS Standart (4 GB RAM)',
            monthly: 349.90,
            yearly: 3499.00,
            features: [
                '4 GB RAM',
                '2 VCPU',
                '100 GB NVMe Disk',
                '1 Gbps Port / 2 TB Trafik'
            ],
            popular: true
        },
        {
            name: 'VDS Pro (8 GB RAM)',
            monthly: 599.90,
            yearly: 5999.00,
            features: [
                '8 GB RAM',
                '4 VCPU',
                '200 GB NVMe Disk',
                'Sınırsız Trafik'
            ]
        },
        {
            name: 'VDS Elite (16 GB RAM)',
            monthly: 999.90,
            yearly: 9999.00,
            features: [
                '16 GB RAM',
                '6 VCPU',
                '400 GB NVMe Disk',
                'Sınırsız Trafik',
                'Öncelikli Destek'
            ]
        }
    ];

    function getUserKey() {
        return currentUser
            ? (currentUser.email || currentUser.name)
            : null;
    }

    function detectServiceType(name) {
        if (!name) return 'hosting';

        if (name.includes('.')) {
            return 'domain';
        }

        const all = [
            ...sslPlans.map(p => [p.name, 'ssl']),
            ...emailPlans.map(p => [p.name, 'email']),
            ...vdsPlans.map(p => [p.name, 'vds']),
            ...hostingPlans.map(p => [p.name, 'hosting'])
        ];

        const found = all.find(([n]) =>
            name === n ||
            name.startsWith(n)
        );

        if (found) {
            return found[1];
        }

        if (/ssl/i.test(name)) {
            return 'ssl';
        }

        if (/mail|e-?posta|email/i.test(name)) {
            return 'email';
        }

        if (/vds|sunucu|server/i.test(name)) {
            return 'vds';
        }

        return 'hosting';
    }

    function getPlanPrice(serviceName, period) {
        const allPlans = [
            ...hostingPlans,
            ...sslPlans,
            ...emailPlans,
            ...vdsPlans
        ];

        const plan = allPlans.find(
            p => p.name === serviceName
        );

        if (!plan) {
            return period === 'yıl'
                ? 399.00
                : 39.90;
        }

        return period === 'yıl'
            ? plan.yearly
            : plan.monthly;
    }

    window.addEventListener(
        'DOMContentLoaded',
        () => {

            const remembered =
                localStorage.getItem(
                    'vortex_logged_user'
                );

            if (remembered) {
                try {
                    currentUser =
                        JSON.parse(remembered);

                    updateAuthUI();

                    const headerUser =
                        document.getElementById(
                            'headerUserName'
                        );

                    if (headerUser) {
                        headerUser.textContent =
                            currentUser.name;

                        headerUser.classList.remove(
                            'hidden'
                        );
                    }

                } catch {}
            }

            setupPaymentValidation();
            renderHomeServiceCards();
            updateTexts();
        }
    );

    let currentServiceCategory = null;

    function showToast(title, message) {
        const titleEl =
            document.getElementById(
                'toastTitle'
            );

        const messageEl =
            document.getElementById(
                'toastMessage'
            );

        const toast =
            document.getElementById(
                'successToast'
            );

        if (titleEl) {
            titleEl.textContent = title;
        }

        if (messageEl) {
            messageEl.textContent = message;
        }

        if (toast) {
            toast.classList.remove('hidden');
        }

        playNotificationSound();

        setTimeout(
            () => hideToast(),
            4500
        );
    }

    function hideToast() {
        const toast =
            document.getElementById(
                'successToast'
            );

        if (toast) {
            toast.classList.add('hidden');
        }
    }

    function getExpiryDate(period) {
        const d = new Date();

        if (period === 'yıl') {
            d.setDate(
                d.getDate() + 365
            );
        } else {
            d.setDate(
                d.getDate() + 30
            );
        }

        return d
            .toISOString()
            .split('T')[0];
    }

    function getDaysLeft(isoDate) {
        if (!isoDate) {
            return 0;
        }

        const today = new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        const expiry =
            new Date(isoDate);

        expiry.setHours(
            0,
            0,
            0,
            0
        );

        const diff =
            Math.ceil(
                (expiry - today) /
                86400000
            );

        return diff > 0
            ? diff
            : 0;
    }

    function formatDate(iso) {
        if (!iso) {
            return '-';
        }

        const d = new Date(iso);

        if (isNaN(d.getTime())) {
            return '-';
        }

        return d.toLocaleDateString(
            'tr-TR'
        );
    }

    function checkExpiredServices() {
        const today =
            new Date()
                .toISOString()
                .split('T')[0];

        let changed = false;

        userServices.forEach(
            service => {

                if (
                    service.status === 'Aktif' &&
                    service.expiryDate <= today
                ) {

                    service.status =
                        'Süresi Doldu';

                    service.logs =
                        service.logs || [];

                    service.logs.unshift({
                        date:
                            new Date()
                                .toLocaleString(
                                    'tr-TR'
                                ),

                        action:
                            'Süre doldu – hizmet durduruldu'
                    });

                    changed = true;
                }
            }
        );

        if (changed) {
            saveUserServices();
        }
    }


    // ======================================================
    // FATURA SİSTEMİ
    // ======================================================

    function saveInvoice(invoice) {
        console.warn(
            'saveInvoice artık kullanılmıyor.',
            invoice
        );
    }

    async function loadInvoices() {
        const token =
            localStorage.getItem(
                'vortex_token'
            );

        if (!token) {
            userInvoices = [];
            return userInvoices;
        }

        try {

            const response =
                await fetch(
                    'https://anazhosting-backend.onrender.com/api/invoices',
                    {
                        headers: {
                            'Authorization':
                                `Bearer ${token}`
                        }
                    }
                );

            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {

                console.error(
                    'Faturalar alınamadı:',
                    data.message ||
                    response.status
                );

                userInvoices = [];

                return userInvoices;
            }

            const rawInvoices =
                Array.isArray(data.invoices)
                    ? data.invoices
                    : [];

            userInvoices =
                rawInvoices.map(inv => {

                    const matchingService =
                        userServices.find(
                            service =>
                                service.name ===
                                inv.service_name
                        );

                    return {
                        dbId:
                            inv.id,

                        id:
                            inv.invoice_no ||
                            `INV-${String(inv.id).padStart(6, '0')}`,

                        service:
                            inv.service_name ||
                            'Hizmet',

                        amount:
                            Number(
                                inv.amount || 0
                            ),

                        period:
                            inv.period ||
                            matchingService?.period ||
                            '-',

                        status:
                            inv.status ||
                            'Ödendi',

                        type:
                            inv.type ||
                            'Satın Alma',

                        createdAt:
                            inv.created_at,

                        date:
                            formatInvoiceDate(
                                inv.created_at
                            )
                    };
                });

            return userInvoices;

        } catch (error) {

            console.error(
                'Backend fatura hatası:',
                error
            );

            userInvoices = [];

            return userInvoices;
        }
    }

    function formatInvoiceDate(value) {
        if (!value) {
            return '-';
        }

        const normalized =
            String(value).includes('T')
                ? String(value)
                : String(value)
                    .replace(
                        ' ',
                        'T'
                    );

        const date =
            new Date(normalized);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return String(value);
        }

        return date
            .toLocaleDateString(
                'tr-TR',
                {
                    day:
                        '2-digit',

                    month:
                        '2-digit',

                    year:
                        'numeric'
                }
            );
    }

    function getInvoiceFinancials(total) {
        const gross =
            Number(total || 0);

        const net =
            gross / 1.20;

        const vat =
            gross - net;

        return {
            net,
            vat,
            gross
        };
    }

    function renderInvoices() {
        const box =
            document.getElementById(
                'invoicesContent'
            );

        if (!box) {
            return;
        }

        const invoices =
            userInvoices;

        if (
            invoices.length === 0
        ) {

            box.innerHTML = `
                <div class="text-center py-16">
                    <div class="w-20 h-20 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-5">
                        <i class="fa-solid fa-file-invoice-dollar text-3xl text-slate-300"></i>
                    </div>

                    <h4 class="text-lg font-semibold text-slate-800 mb-2">
                        Henüz fatura yok
                    </h4>

                    <p class="text-slate-500">
                        İlk satın alımınızdan sonra faturanız burada görünür.
                    </p>
                </div>
            `;

            return;
        }

        const paidInvoices =
            invoices.filter(
                inv =>
                    inv.status === 'Ödendi'
            );

        const paidTotal =
            paidInvoices.reduce(
                (sum, inv) =>
                    sum +
                    Number(
                        inv.amount || 0
                    ),
                0
            );

        box.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Toplam Fatura
                    </div>

                    <div class="text-2xl font-extrabold text-slate-900 mt-2">
                        ${invoices.length}
                    </div>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Ödenen
                    </div>

                    <div class="text-2xl font-extrabold text-emerald-600 mt-2">
                        ${paidInvoices.length}
                    </div>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Toplam Ödeme
                    </div>

                    <div class="text-2xl font-extrabold text-slate-900 mt-2">
                        ₺${paidTotal.toFixed(2)}
                    </div>
                </div>

            </div>

            <div class="overflow-hidden rounded-2xl border border-slate-200">

                <div class="overflow-x-auto">

                    <table class="w-full min-w-[760px] text-sm">

                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr class="text-left text-xs uppercase tracking-wide text-slate-500">

                                <th class="px-5 py-4 font-semibold">
                                    Fatura No
                                </th>

                                <th class="px-5 py-4 font-semibold">
                                    Hizmet
                                </th>

                                <th class="px-5 py-4 font-semibold">
                                    Tarih
                                </th>

                                <th class="px-5 py-4 font-semibold">
                                    Tür
                                </th>

                                <th class="px-5 py-4 font-semibold">
                                    Tutar
                                </th>

                                <th class="px-5 py-4 font-semibold">
                                    Durum
                                </th>

                                <th class="px-5 py-4 font-semibold text-right">
                                    İşlem
                                </th>

                            </tr>
                        </thead>

                        <tbody class="divide-y divide-slate-100 bg-white">

                            ${invoices.map(
                                inv => {

                                    const isPaid =
                                        inv.status ===
                                        'Ödendi';

                                    return `
                                        <tr class="hover:bg-slate-50/70 transition">

                                            <td class="px-5 py-4 font-mono text-xs font-semibold text-slate-700">
                                                ${inv.id}
                                            </td>

                                            <td class="px-5 py-4">

                                                <div class="font-semibold text-slate-900">
                                                    ${inv.service}
                                                </div>

                                                <div class="text-xs text-slate-400 mt-1">
                                                    ${inv.period || '-'}
                                                </div>

                                            </td>

                                            <td class="px-5 py-4 text-slate-600">
                                                ${inv.date}
                                            </td>

                                            <td class="px-5 py-4 text-slate-600">
                                                ${inv.type}
                                            </td>

                                            <td class="px-5 py-4 font-bold text-slate-900">
                                                ₺${Number(inv.amount).toFixed(2)}
                                            </td>

                                            <td class="px-5 py-4">

                                                <span
                                                    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                                        isPaid
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : 'bg-amber-50 text-amber-600'
                                                    }"
                                                >

                                                    <span
                                                        class="w-1.5 h-1.5 rounded-full ${
                                                            isPaid
                                                                ? 'bg-emerald-500'
                                                                : 'bg-amber-500'
                                                        }"
                                                    ></span>

                                                    ${inv.status}

                                                </span>

                                            </td>

                                            <td class="px-5 py-4 text-right">

                                                <button
                                                    onclick="openInvoiceDetail(${inv.dbId})"
                                                    class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-600 transition"
                                                >

                                                    <i class="fa-solid fa-eye"></i>

                                                    Görüntüle

                                                </button>

                                            </td>

                                        </tr>
                                    `;
                                }
                            ).join('')}

                        </tbody>

                    </table>

                </div>

            </div>

            <div class="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">

                <i class="fa-solid fa-circle-info mr-1"></i>

                Bu ekran müşteri panelindeki ödeme kaydıdır.
                Resmî e-Fatura veya e-Arşiv belgesi için daha sonra
                GİB uyumlu entegratör bağlanacaktır.

            </div>
        `;
    }

    function ensureInvoiceModal() {
        if (
            document.getElementById(
                'invoiceModal'
            )
        ) {
            return;
        }

        const modal =
            document.createElement(
                'div'
            );

        modal.id =
            'invoiceModal';

        modal.className =
            'fixed inset-0 z-[70] hidden bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto';

        modal.innerHTML = `
            <div class="min-h-full flex items-center justify-center py-8">

                <div class="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden">

                    <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">

                        <div>
                            <h3 class="font-bold text-slate-900">
                                Fatura Detayı
                            </h3>

                            <p class="text-xs text-slate-500 mt-1">
                                İşlem ve ödeme bilgileri
                            </p>
                        </div>

                        <button
                            onclick="closeInvoiceModal()"
                            class="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>

                    </div>

                    <div
                        class="p-6 md:p-8"
                        id="invoiceDetailContent"
                    ></div>

                    <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">

                        <button
                            onclick="closeInvoiceModal()"
                            class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                            Kapat
                        </button>

                        <button
                            onclick="printInvoice()"
                            class="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition"
                        >
                            <i class="fa-solid fa-print"></i>
                            Yazdır / PDF Kaydet
                        </button>

                    </div>

                </div>

            </div>
        `;

        modal.addEventListener(
            'click',
            event => {

                if (
                    event.target === modal
                ) {
                    closeInvoiceModal();
                }
            }
        );

        document.body.appendChild(
            modal
        );
    }

    function openInvoiceDetail(dbId) {
        ensureInvoiceModal();

        const invoice =
            userInvoices.find(
                inv =>
                    Number(inv.dbId) ===
                    Number(dbId)
            );

        if (!invoice) {
            showToast(
                'Fatura Bulunamadı',
                'Fatura bilgisine ulaşılamadı.'
            );

            return;
        }

        const modal =
            document.getElementById(
                'invoiceModal'
            );

        const content =
            document.getElementById(
                'invoiceDetailContent'
            );

        if (
            !modal ||
            !content
        ) {
            return;
        }

        const financials =
            getInvoiceFinancials(
                invoice.amount
            );

        const customerName =
            currentUser?.name ||
            'Müşteri';

        const customerEmail =
            currentUser?.email ||
            '-';

        content.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-6">

                <div>

                    <div class="flex items-center gap-3">

                        <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">

                            <i class="fa-solid fa-cube text-white"></i>

                        </div>

                        <div>

                            <div class="font-extrabold text-xl tracking-tight text-slate-900">
                                 ANAZHOSTING
                            </div>

                            <div class="text-xs text-slate-500">
                                Hosting ve bulut hizmetleri
                            </div>

                        </div>

                    </div>

                    <div class="mt-4 text-xs leading-6 text-slate-500">

                        destek@anazhosting.com.tr
                        <br>

                        Vergi / şirket bilgileri şirket kurulumu sonrası eklenecek

                    </div>

                </div>

                <div class="sm:text-right">

                    <div class="text-xs font-semibold uppercase tracking-widest text-sky-600">
                        FATURA
                    </div>

                    <div class="text-xl font-extrabold text-slate-900 mt-1">
                        ${invoice.id}
                    </div>

                    <div class="mt-3 text-xs leading-6 text-slate-500">

                        Tarih:

                        <span class="font-medium text-slate-700">
                            ${invoice.date}
                        </span>

                        <br>

                        Durum:

                        <span
                            class="font-semibold ${
                                invoice.status === 'Ödendi'
                                    ? 'text-emerald-600'
                                    : 'text-amber-600'
                            }"
                        >
                            ${invoice.status}
                        </span>

                    </div>

                </div>

            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 py-6">

                <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                        Fatura Edilen
                    </div>

                    <div class="font-semibold text-slate-900">
                        ${customerName}
                    </div>

                    <div class="text-sm text-slate-500 mt-1">
                        ${customerEmail}
                    </div>

                </div>

                <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                        Ödeme Bilgisi
                    </div>

                    <div class="font-semibold text-slate-900">
                        ${invoice.type}
                    </div>

                    <div class="text-sm text-slate-500 mt-1">

                        Ödeme durumu:
                        ${invoice.status}

                    </div>

                </div>

            </div>

            <div class="overflow-hidden rounded-xl border border-slate-200">

                <table class="w-full text-sm">

                    <thead class="bg-slate-50 border-b border-slate-200">

                        <tr class="text-left text-xs uppercase tracking-wide text-slate-500">

                            <th class="px-4 py-3 font-semibold">
                                Açıklama
                            </th>

                            <th class="px-4 py-3 font-semibold">
                                Dönem
                            </th>

                            <th class="px-4 py-3 font-semibold text-right">
                                Tutar
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        <tr>

                            <td class="px-4 py-4">

                                <div class="font-semibold text-slate-900">
                                    ${invoice.service}
                                </div>

                                <div class="text-xs text-slate-400 mt-1">
                                    ANAZHOSTING hizmet bedeli
                                </div>

                            </td>

                            <td class="px-4 py-4 text-slate-600">
                                ${invoice.period || '-'}
                            </td>

                            <td class="px-4 py-4 text-right font-semibold text-slate-900">
                                ₺${financials.gross.toFixed(2)}
                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

            <div class="mt-6 flex justify-end">

                <div class="w-full sm:w-80 space-y-2 text-sm">

                    <div class="flex justify-between text-slate-500">

                        <span>
                            KDV Hariç
                        </span>

                        <span>
                            ₺${financials.net.toFixed(2)}
                        </span>

                    </div>

                    <div class="flex justify-between text-slate-500">

                        <span>
                            KDV (%20)
                        </span>

                        <span>
                            ₺${financials.vat.toFixed(2)}
                        </span>

                    </div>

                    <div class="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-900">

                        <span>
                            Genel Toplam
                        </span>

                        <span>
                            ₺${financials.gross.toFixed(2)}
                        </span>

                    </div>

                </div>

            </div>

            <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">

                Bu belge müşteri panelindeki işlem kaydıdır.
                Resmî e-Fatura / e-Arşiv yerine geçmez.

            </div>
        `;

        modal.classList.remove(
            'hidden'
        );
    }

    function closeInvoiceModal() {
        const modal =
            document.getElementById(
                'invoiceModal'
            );

        if (modal) {
            modal.classList.add(
                'hidden'
            );
        }
    }

    function printInvoice() {
        const content =
            document.getElementById(
                'invoiceDetailContent'
            );

        if (
            !content ||
            !content.innerHTML.trim()
        ) {

            showToast(
                'Fatura Bulunamadı',
                'Yazdırılacak fatura bulunamadı.'
            );

            return;
        }

        const printWindow =
            window.open(
                '',
                '_blank',
                'width=900,height=700'
            );

        if (!printWindow) {

            showToast(
                'Tarayıcı Engelledi',
                'Yazdırma penceresi açılamadı.'
            );

            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>

            <html lang="tr">

            <head>

                <meta charset="UTF-8">

                <title>
                    ANAZHOSTING Fatura
                </title>

                <script src="https://cdn.tailwindcss.com"><\/script>

                <style>

                    body {
                        font-family:
                            Arial,
                            sans-serif;

                        background:
                            white;

                        padding:
                            32px;

                        color:
                            #0f172a;
                    }

                    button {
                        display:
                            none !important;
                    }

                    @media print {
                        body {
                            padding:
                                0;
                        }
                    }

                </style>

            </head>

            <body>

                <div style="max-width: 900px; margin: 0 auto;">

                    ${content.innerHTML}

                </div>

                <script>

                    window.onload =
                        function () {
                            window.print();
                        };

                <\/script>

            </body>

            </html>
        `);

        printWindow.document.close();
    }


    // ======================================================
    // HİZMET YENİLEME / İPTAL
    // ======================================================
    async function cancelService(index) {
        const service =
            userServices[index];

        if (!service) {
            showToast(
                'Hata',
                'Hizmet bulunamadı.'
            );

            return;
        }

        if (!service.id) {
            showToast(
                'Hata',
                'Hizmet ID bulunamadı.'
            );

            return;
        }

        if (
            service.status ===
            'İptal Edildi'
        ) {
            showToast(
                'Bilgi',
                'Bu hizmet zaten iptal edilmiş.'
            );

            return;
        }



        const token =
            localStorage.getItem(
                'vortex_token'
            );

        if (!token) {
            showToast(
                'Oturum Hatası',
                'Lütfen tekrar giriş yapın.'
            );

            return;
        }

        try {
            const response =
                await fetch(
                    `https://anazhosting-backend.onrender.com/api/services/${service.id}/cancel`,
                    {
                        method:
                            'POST',

                        headers: {
                            'Content-Type':
                                'application/json',

                            'Authorization':
                                `Bearer ${token}`
                        }
                    }
                );

            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                console.error(
                    'CANCEL ERROR:',
                    response.status,
                    data
                );

                showToast(
                    'İptal Başarısız',
                    data.message ||
                    'Hizmet iptal edilemedi.'
                );

                return;
            }

            // Eğer iptal edilen hizmet yenileme sepetindeyse
            // sepeti de temizle
            if (
                Number(renewingServiceId) ===
                Number(service.id)
            ) {
                cart = [];

                renewingServiceIndex =
                    null;

                renewingServiceId =
                    null;

                renewSelectedPeriod =
                    'ay';

                updateCartBadge();
            }

            await loadUserServices();

            renderServices();
            updateStats();

            // Detay ekranındaysak hizmetlere dön
            const detailSection =
                document.getElementById(
                    'section-service-detail'
                );

            if (
                detailSection &&
                !detailSection.classList.contains(
                    'hidden'
                )
            ) {
                await showDashboardSection(
                    'services'
                );
            }

            showToast(
                'Hizmet İptal Edildi',
                `${service.name} başarıyla iptal edildi.`
            );

        } catch (error) {
            console.error(
                'CANCEL SERVICE ERROR:',
                error
            );

            showToast(
                'Bağlantı Hatası',
                'Backend sunucusuna bağlanılamadı.'
            );
        }
    }

    function renewService(index) {
        const service =
            userServices[index];

        if (!service) {
            showToast(
                'Hata',
                'Hizmet bulunamadı.'
            );

            return;
        }

        if (!service.id) {
            showToast(
                'Hata',
                'Hizmet ID bulunamadı.'
            );

            return;
        }

        if (
            service.status ===
            'İptal Edildi'
        ) {
            showToast(
                'Yenileme Yapılamaz',
                'İptal edilmiş hizmet yenilenemez.'
            );

            return;
        }

        renewingServiceIndex =
            index;

        renewingServiceId =
            Number(service.id);

        renewSelectedPeriod =
            service.type === 'domain'
                ? 'yıl'
                : (
                    service.period === 'yıl'
                        ? 'yıl'
                        : 'ay'
                );

        const price =
            service.type === 'domain'
                ? Number(service.price)
                : getPlanPrice(
                    service.name,
                    renewSelectedPeriod
                );

        // Yenileme için sepette tek ürün tutuyoruz
        cart = [
            {
                name:
                    service.name +
                    ' (Yenileme)',

                price:
                    Number(price),

                period:
                    renewSelectedPeriod,

                mode:
                    'renewal',

                serviceId:
                    Number(service.id)
            }
        ];

        const title =
            document.getElementById(
                'cartModalTitle'
            );

        if (title) {
            title.textContent =
                'Hizmet Yenileme';
        }

        const selector =
            document.getElementById(
                'renewPeriodSelector'
            );

        if (selector) {
            if (
                service.type ===
                'domain'
            ) {
                selector.classList.add(
                    'hidden'
                );

            } else {
                selector.classList.remove(
                    'hidden'
                );
            }
        }

        updateRenewPeriodButtons();
        updateCartBadge();
        openCartModal();
    }

    function selectRenewPeriod(period) {
        const service =
            userServices.find(
                item =>
                    Number(item.id) ===
                    Number(renewingServiceId)
            );

        if (!service) {
            showToast(
                'Hata',
                'Yenilenecek hizmet bulunamadı.'
            );

            return;
        }

        if (
            service.status ===
            'İptal Edildi'
        ) {
            return;
        }

        if (
            service.type ===
            'domain'
        ) {
            renewSelectedPeriod =
                'yıl';

            period =
                'yıl';
        } else {
            renewSelectedPeriod =
                period === 'yıl'
                    ? 'yıl'
                    : 'ay';
        }

        const price =
            service.type === 'domain'
                ? Number(service.price)
                : getPlanPrice(
                    service.name,
                    renewSelectedPeriod
                );

        cart = [
            {
                name:
                    service.name +
                    ' (Yenileme)',

                price:
                    Number(price),

                period:
                    renewSelectedPeriod,

                mode:
                    'renewal',

                serviceId:
                    Number(service.id)
            }
        ];

        updateRenewPeriodButtons();
        updateCartBadge();
        renderCart();
    }

    function updateRenewPeriodButtons() {
        const monthlyBtn =
            document.getElementById(
                'renewMonthlyBtn'
            );

        const yearlyBtn =
            document.getElementById(
                'renewYearlyBtn'
            );

        if (
            !monthlyBtn ||
            !yearlyBtn
        ) {
            return;
        }

        if (
            renewSelectedPeriod ===
            'ay'
        ) {
            monthlyBtn.className =
                'flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-sky-500 bg-sky-500 text-white';

            yearlyBtn.className =
                'flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-slate-200 text-slate-600 bg-white';

        } else {
            monthlyBtn.className =
                'flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-slate-200 text-slate-600 bg-white';

            yearlyBtn.className =
                'flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-sky-500 bg-sky-500 text-white';
        }
    }


    // ======================================================
    // SATIN ALMA
    // ======================================================

    async function completeCheckout(e) {
        e.preventDefault();

        if (!validatePaymentForm()) {
            return;
        }

        if (!currentUser) {
            closeCartModal();
            openLoginModal();
            return;
        }

        const token =
            localStorage.getItem(
                'vortex_token'
            );

        if (!token) {
            showToast(
                'Oturum Hatası',
                'Lütfen tekrar giriş yapın.'
            );

            return;
        }

        if (
            !Array.isArray(cart) ||
            cart.length === 0
        ) {
            showToast(
                'Sepet Boş',
                'Sepetinizde ürün bulunmuyor.'
            );

            return;
        }

        try {

            // =================================================
            // YENİLEME İŞLEMİ
            // =================================================

            const renewalItem =
                cart.find(
                    item =>
                        item.mode ===
                            'renewal' &&
                        item.serviceId
                );

            if (renewalItem) {

                const service =
                    userServices.find(
                        item =>
                            Number(item.id) ===
                            Number(
                                renewalItem.serviceId
                            )
                    );

                if (
                    !service ||
                    !service.id
                ) {
                    showToast(
                        'Yenileme Hatası',
                        'Yenilenecek hizmet bulunamadı.'
                    );

                    return;
                }

                if (
                    service.status ===
                    'İptal Edildi'
                ) {
                    showToast(
                        'Yenileme Yapılamaz',
                        'İptal edilmiş hizmet yenilenemez.'
                    );

                    return;
                }

                const finalPeriod =
                    service.type ===
                    'domain'
                        ? 'yıl'
                        : (
                            renewalItem.period ===
                            'yıl'
                                ? 'yıl'
                                : 'ay'
                        );

                const response =
                    await fetch(
                        `https://anazhosting-backend.onrender.com/api/services/${service.id}/renew`,
                        {
                            method:
                                'POST',

                            headers: {
                                'Content-Type':
                                    'application/json',

                                'Authorization':
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify({
                                    period:
                                        finalPeriod
                                })
                        }
                    );

                let data = {};

                try {
                    data =
                        await response.json();
                } catch {
                    data = {};
                }

                if (!response.ok) {
                    console.error(
                        'RENEW ERROR:',
                        response.status,
                        data
                    );

                    showToast(
                        'Yenileme Başarısız',
                        data.message ||
                        'Hizmet yenilenemedi.'
                    );

                    return;
                }

                [
                    'ccName',
                    'ccNumber',
                    'ccExp',
                    'ccCvv'
                ].forEach(
                    id => {
                        const el =
                            document.getElementById(
                                id
                            );

                        if (el) {
                            el.value = '';
                        }
                    }
                );

                cart = [];

                renewingServiceIndex =
                    null;

                renewingServiceId =
                    null;

                renewSelectedPeriod =
                    'ay';

                updateCartBadge();

                closeCartModal();

                await loadUserServices();

                if (
                    typeof loadInvoices ===
                    'function'
                ) {
                    await loadInvoices();
                }

                renderServices();

                if (
                    typeof renderInvoices ===
                    'function'
                ) {
                    renderInvoices();
                }

                updateStats();

                await showDashboardSection(
                    'services'
                );

                showToast(
                    'Yenileme Başarılı',
                    `Hizmetiniz ${formatDate(data.newExpiryDate)} tarihine kadar uzatıldı.`
                );

                return;
            }


            // =================================================
            // NORMAL SATIN ALMA
            // =================================================

            const items =
                cart
                    .filter(
                        item =>
                            item.mode !==
                            'renewal'
                    )
                    .map(
                        item => ({
                            name:
                                String(
                                    item.name ||
                                    ''
                                )
                                    .replace(
                                        /\s*\(Yenileme\)\s*$/i,
                                        ''
                                    )
                                    .trim(),

                            price:
                                Number(
                                    item.price
                                ),

                            period:
                                item.period,

                            type:
                                detectServiceType(
                                    String(
                                        item.name ||
                                        ''
                                    )
                                        .replace(
                                            /\s*\(Yenileme\)\s*$/i,
                                            ''
                                        )
                                        .trim()
                                )
                        })
                    );

            if (
                items.length ===
                0
            ) {
                showToast(
                    'Sepet Hatası',
                    'Satın alınabilecek ürün bulunamadı.'
                );

                return;
            }

            const response =
                await fetch(
                    'https://anazhosting-backend.onrender.com/api/checkout',
                    {
                        method:
                            'POST',

                        headers: {
                            'Content-Type':
                                'application/json',

                            'Authorization':
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({
                                items
                            })
                    }
                );

            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                console.error(
                    'CHECKOUT ERROR:',
                    response.status,
                    data
                );

                showToast(
                    'Satın Alma Başarısız',
                    data.message ||
                    'Sipariş oluşturulamadı.'
                );

                return;
            }

            [
                'ccName',
                'ccNumber',
                'ccExp',
                'ccCvv'
            ].forEach(
                id => {
                    const el =
                        document.getElementById(
                            id
                        );

                    if (el) {
                        el.value = '';
                    }
                }
            );

            cart = [];

            renewingServiceIndex =
                null;

            renewingServiceId =
                null;

            renewSelectedPeriod =
                'ay';

            updateCartBadge();

            closeCartModal();

            await loadUserServices();

            if (
                typeof loadInvoices ===
                'function'
            ) {
                await loadInvoices();
            }

            renderServices();

            if (
                typeof renderInvoices ===
                'function'
            ) {
                renderInvoices();
            }

            updateStats();

            const dashboard =
                document.getElementById(
                    'userDashboard'
                );

            if (
                dashboard &&
                !dashboard.classList.contains(
                    'hidden'
                )
            ) {
                await showDashboardSection(
                    'services'
                );
            }

            showToast(
                'Ödeme Başarılı',
                'Hizmetiniz başarıyla aktif edildi ve faturanız oluşturuldu.'
            );

        } catch (error) {
            console.error(
                'CHECKOUT / RENEW ERROR:',
                error
            );

            showToast(
                'Bağlantı Hatası',
                'Backend sunucusuna bağlanılamadı.'
            );
        }
    }


    // ======================================================
    // PAKET SAYFALARI
    // ======================================================

    function setBillingPeriod(period) {
        currentBillingPeriod =
            period;

        const monthlyBtn =
            document.getElementById(
                'billingMonthly'
            );

        const yearlyBtn =
            document.getElementById(
                'billingYearly'
            );

        if (monthlyBtn) {
            monthlyBtn.className =
                period === 'ay'
                    ? 'px-6 py-2.5 rounded-lg text-sm font-semibold bg-sky-500 text-white transition'
                    : 'px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-600 transition';
        }

        if (yearlyBtn) {
            yearlyBtn.className =
                period === 'yıl'
                    ? 'px-6 py-2.5 rounded-lg text-sm font-semibold bg-sky-500 text-white transition'
                    : 'px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-600 transition';
        }

        if (
            currentServiceCategory
        ) {
            renderServicePlansPage();
        }
    }

    function getPlansByCategory(cat) {
        if (cat === 'hosting') {
            return hostingPlans;
        }

        if (cat === 'vds') {
            return vdsPlans;
        }

        if (cat === 'ssl') {
            return sslPlans;
        }

        if (cat === 'email') {
            return emailPlans;
        }

        return [];
    }

    function openServiceCategory(cat) {
        if (
            cat === 'website'
        ) {

            showToast(
                t('soonTitle'),
                t('soonMsg')
            );

            return;
        }

        if (
            cat === 'domain'
        ) {

            showHomeView();

            setTimeout(
                () => {

                    const el =
                        document.getElementById(
                            'domainInput'
                        );

                    if (el) {
                        el.focus();

                        el.scrollIntoView({
                            behavior:
                                'smooth',

                            block:
                                'center'
                        });
                    }
                },
                200
            );

            return;
        }

        currentServiceCategory =
            cat;

        const titles = {

            hosting: {
                title:
                    t('hostingTitle'),

                desc:
                    t('hostingDesc')
            },

            vds: {
                title:
                    t('vdsTitle'),

                desc:
                    t('vdsDesc')
            },

            ssl: {
                title:
                    t('sslTitle'),

                desc:
                    t('sslDesc')
            },

            email: {
                title:
                    t('emailTitle'),

                desc:
                    t('emailDesc')
            }
        };

        const info =
            titles[cat] || {
                title:
                    t('packages'),

                desc:
                    t('choosePackage')
            };

        const titleEl =
            document.getElementById(
                'servicePlansTitle'
            );

        const descEl =
            document.getElementById(
                'servicePlansDesc'
            );

        if (titleEl) {
            titleEl.textContent =
                info.title;
        }

        if (descEl) {
            descEl.textContent =
                info.desc;
        }

        const app =
            document.getElementById(
                'appContainer'
            );

        const dash =
            document.getElementById(
                'userDashboard'
            );

        const page =
            document.getElementById(
                'servicePlansPage'
            );

        if (app) {
            app.style.display =
                'none';
        }

        if (dash) {
            dash.classList.add(
                'hidden'
            );
        }

        if (page) {
            page.classList.remove(
                'hidden'
            );
        }

        window.scrollTo({
            top:
                0,

            behavior:
                'smooth'
        });

        renderServicePlansPage();
    }

    function closeServicePlansPage() {
        currentServiceCategory =
            null;

        const page =
            document.getElementById(
                'servicePlansPage'
            );

        const app =
            document.getElementById(
                'appContainer'
            );

        const dashboard =
            document.getElementById(
                'userDashboard'
            );

        if (page) {
            page.classList.add(
                'hidden'
            );
        }

        if (currentUser) {

            if (app) {
                app.style.display =
                    'none';
            }

            if (dashboard) {
                dashboard.classList.remove(
                    'hidden'
                );
            }

            showDashboardSection(
                'overview'
            );

            window.scrollTo({
                top:
                    0,

                behavior:
                    'smooth'
            });

        } else {

            if (dashboard) {
                dashboard.classList.add(
                    'hidden'
                );
            }

            if (app) {
                app.style.display =
                    'block';
            }

            window.scrollTo({
                top:
                    0,

                behavior:
                    'smooth'
            });
        }
    }

    function renderServicePlansPage() {
        const grid =
            document.getElementById(
                'servicePlansGrid'
            );

        if (
            !grid ||
            !currentServiceCategory
        ) {
            return;
        }

        const plans =
            getPlansByCategory(
                currentServiceCategory
            );

        grid.innerHTML =
            plans.map(
                plan => {

                    const price =
                        currentBillingPeriod ===
                        'ay'
                            ? plan.monthly
                            : plan.yearly;

                    const isPopular =
                        plan.popular;

                    return `
                        <div
                            class="bg-white rounded-2xl border ${
                                isPopular
                                    ? 'border-sky-400 shadow-xl shadow-sky-100'
                                    : 'border-slate-200 shadow-sm'
                            } p-6 flex flex-col relative"
                        >

                            ${
                                isPopular
                                    ? `
                                        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                                            ${t('popular')}
                                        </div>
                                    `
                                    : ''
                            }

                            <div class="text-xs font-semibold text-slate-500 uppercase mb-2">
                                ${plan.name}
                            </div>

                            <div class="text-3xl font-bold text-slate-900">
                                ₺${price.toFixed(2)}

                                <span class="text-sm font-medium text-slate-400">
                                    /${currentBillingPeriod}
                                </span>
                            </div>

                            <ul class="mt-6 space-y-2.5 text-sm text-slate-600 flex-grow">

                                ${plan.features.map(
                                    feature => `
                                        <li class="flex items-center gap-2">

                                            <i class="fa-solid fa-check text-sky-500 text-xs"></i>

                                            ${feature}

                                        </li>
                                    `
                                ).join('')}

                            </ul>

                            <button
                                onclick="addToCart('${plan.name}', ${price}, '${currentBillingPeriod}')"
                                class="mt-6 w-full py-3 rounded-xl text-sm font-semibold ${
                                    isPopular
                                        ? 'bg-sky-500 text-white hover:bg-sky-600'
                                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                } transition"
                            >
                                ${t('addToCart')}
                            </button>

                        </div>
                    `;
                }
            ).join('');
    }

    function renderHomeServiceCards() {
        const grid =
            document.getElementById(
                'homeServicesGrid'
            );

        if (!grid) {
            return;
        }

        const cards = [
            {
                icon:
                    'fa-globe',

                iconBg:
                    'bg-violet-100 text-violet-600',

                title:
                    t('catDomain'),

                desc:
                    t('catDomainDesc'),

                btnText:
                    t('btnQuery'),

                btnClass:
                    'border border-slate-200 text-slate-700 hover:bg-slate-50',

                cat:
                    'domain'
            },
            {
                icon:
                    'fa-server',

                iconBg:
                    'bg-sky-100 text-sky-600',

                title:
                    t('catHosting'),

                desc:
                    t('catHostingDesc'),

                btnText:
                    t('btnBuy'),

                btnClass:
                    'bg-sky-500 text-white hover:bg-sky-600',

                cat:
                    'hosting'
            },
            {
                icon:
                    'fa-microchip',

                iconBg:
                    'bg-indigo-100 text-indigo-600',

                title:
                    t('catVds'),

                desc:
                    t('catVdsDesc'),

                btnText:
                    t('btnBuy'),

                btnClass:
                    'bg-indigo-500 text-white hover:bg-indigo-600',

                cat:
                    'vds'
            },
            {
                icon:
                    'fa-lock',

                iconBg:
                    'bg-emerald-100 text-emerald-600',

                title:
                    t('catSsl'),

                desc:
                    t('catSslDesc'),

                btnText:
                    t('btnBuy'),

                btnClass:
                    'bg-emerald-500 text-white hover:bg-emerald-600',

                cat:
                    'ssl'
            },
            {
                icon:
                    'fa-envelope',

                iconBg:
                    'bg-amber-100 text-amber-600',

                title:
                    t('catEmail'),

                desc:
                    t('catEmailDesc'),

                btnText:
                    t('btnBuy'),

                btnClass:
                    'bg-amber-500 text-white hover:bg-amber-600',

                cat:
                    'email'
            },
            {
                icon:
                    'fa-wand-magic-sparkles',

                iconBg:
                    'bg-rose-100 text-rose-600',

                title:
                    t('catAi'),

                desc:
                    t('catAiDesc'),

                btnText:
                    t('btnBuy'),

                btnClass:
                    'bg-rose-500 text-white hover:bg-rose-600',

                cat:
                    'website'
            }
        ];

        grid.innerHTML =
            cards.map(
                card => `
                    <div
                        class="group relative bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col gap-4 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-200"
                    >

                        <div
                            class="w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center text-lg"
                        >
                            <i class="fa-solid ${card.icon}"></i>
                        </div>

                        <div class="flex-1">

                            <h3 class="font-semibold text-slate-900 text-[15px] leading-snug">
                                ${card.title}
                            </h3>

                            <p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
                                ${card.desc}
                            </p>

                        </div>

                        <button
                            onclick="openServiceCategory('${card.cat}')"
                            class="w-full py-2.5 rounded-xl text-sm font-semibold ${card.btnClass} transition"
                        >
                            ${card.btnText}
                        </button>

                    </div>
                `
            ).join('');
    }


    // ======================================================
    // ÖDEME FORMU
    // ======================================================

    function setupPaymentValidation() {
        const ccNum =
            document.getElementById(
                'ccNumber'
            );

        if (ccNum) {

            ccNum.addEventListener(
                'input',
                e => {

                    let value =
                        e.target.value
                            .replace(
                                /\D/g,
                                ''
                            )
                            .substring(
                                0,
                                16
                            );

                    e.target.value =
                        value.replace(
                            /(\d{4})(?=\d)/g,
                            '$1 '
                        );

                    clearError(
                        'ccNumber'
                    );
                }
            );
        }

        const ccExp =
            document.getElementById(
                'ccExp'
            );

        if (ccExp) {

            ccExp.addEventListener(
                'input',
                e => {

                    let value =
                        e.target.value
                            .replace(
                                /\D/g,
                                ''
                            );

                    if (
                        value.length >= 2
                    ) {

                        value =
                            value.substring(
                                0,
                                2
                            ) +
                            '/' +
                            value.substring(
                                2,
                                4
                            );
                    }

                    e.target.value =
                        value;

                    clearError(
                        'ccExp'
                    );
                }
            );
        }

        const ccCvv =
            document.getElementById(
                'ccCvv'
            );

        if (ccCvv) {

            ccCvv.addEventListener(
                'input',
                e => {

                    e.target.value =
                        e.target.value
                            .replace(
                                /\D/g,
                                ''
                            )
                            .substring(
                                0,
                                4
                            );

                    clearError(
                        'ccCvv'
                    );
                }
            );
        }

        const ccName =
            document.getElementById(
                'ccName'
            );

        if (ccName) {

            ccName.addEventListener(
                'input',
                () =>
                    clearError(
                        'ccName'
                    )
            );
        }
    }

    function clearError(field) {
        document
            .getElementById(field)
            ?.classList.remove(
                'input-error'
            );

        document
            .getElementById(
                'err-' + field
            )
            ?.classList.remove(
                'show'
            );
    }

    function showError(field, message) {
        document
            .getElementById(field)
            ?.classList.add(
                'input-error'
            );

        const error =
            document.getElementById(
                'err-' + field
            );

        if (error) {

            error.textContent =
                message;

            error.classList.add(
                'show'
            );
        }
    }

    function isValidCardNumber(num) {
        const clean =
            num.replace(
                /\s/g,
                ''
            );

        if (
            !/^\d{13,19}$/.test(
                clean
            )
        ) {
            return false;
        }

        let sum = 0;
        let dbl = false;

        for (
            let i = clean.length - 1;
            i >= 0;
            i--
        ) {

            let digit =
                parseInt(
                    clean[i]
                );

            if (dbl) {

                digit *= 2;

                if (
                    digit > 9
                ) {
                    digit -= 9;
                }
            }

            sum += digit;
            dbl = !dbl;
        }

        return (
            sum % 10 === 0
        );
    }

    function isValidExpiry(exp) {
        if (
            !/^\d{2}\/\d{2}$/.test(
                exp
            )
        ) {
            return false;
        }

        const [
            month,
            year
        ] =
            exp
                .split('/')
                .map(Number);

        if (
            month < 1 ||
            month > 12
        ) {
            return false;
        }

        const now =
            new Date();

        const currentYear =
            now.getFullYear() %
            100;

        const currentMonth =
            now.getMonth() +
            1;

        return (
            year > currentYear ||
            (
                year === currentYear &&
                month >= currentMonth
            )
        );
    }

    function validatePaymentForm() {
        let ok = true;

        const nameEl =
            document.getElementById(
                'ccName'
            );

        if (
            nameEl &&
            nameEl.value
                .trim()
                .length < 3
        ) {

            showError(
                'ccName',
                'Ad Soyad en az 3 karakter'
            );

            ok = false;
        }

        const numEl =
            document.getElementById(
                'ccNumber'
            );

        if (numEl) {

            const number =
                numEl.value;

            if (
                number
                    .replace(
                        /\s/g,
                        ''
                    )
                    .length < 13
            ) {

                showError(
                    'ccNumber',
                    'Kart numarası eksik'
                );

                ok = false;

            } else if (
                !isValidCardNumber(
                    number
                )
            ) {

                showError(
                    'ccNumber',
                    'Geçersiz kart numarası'
                );

                ok = false;
            }
        }

        const expEl =
            document.getElementById(
                'ccExp'
            );

        if (expEl) {

            const exp =
                expEl.value;

            if (!exp) {

                showError(
                    'ccExp',
                    'Tarih zorunlu'
                );

                ok = false;

            } else if (
                !isValidExpiry(
                    exp
                )
            ) {

                showError(
                    'ccExp',
                    'Geçersiz veya geçmiş tarih'
                );

                ok = false;
            }
        }

        const cvvEl =
            document.getElementById(
                'ccCvv'
            );

        if (
            cvvEl &&
            cvvEl.value.length < 3
        ) {

            showError(
                'ccCvv',
                'CVV 3-4 hane olmalı'
            );

            ok = false;
        }

        return ok;
    }


    // ======================================================
    // SEPET
    // ======================================================

    function addToCart(
        name,
        price,
        period
    ) {
        // Normal satın alma moduna geç
        renewingServiceIndex = null;
        renewingServiceId = null;
        renewSelectedPeriod = 'ay';

        cart.push({
            name: name,
            price: Number(price),
            period: period,
            mode: 'purchase',
            serviceId: null
        });

        const title =
            document.getElementById(
                'cartModalTitle'
            );

        if (title) {
            title.textContent =
                'Sepet & Ödeme';
        }

        const selector =
            document.getElementById(
                'renewPeriodSelector'
            );

        if (selector) {
            selector.classList.add(
                'hidden'
            );
        }

        updateCartBadge();
        openCartModal();
    }

    function removeFromCart(index) {
        const removedItem =
            cart[index];

        cart.splice(
            index,
            1
        );

        if (
            removedItem &&
            removedItem.mode === 'renewal'
        ) {
            renewingServiceIndex = null;
            renewingServiceId = null;
            renewSelectedPeriod = 'ay';
        }

        if (cart.length === 0) {
            renewingServiceIndex = null;
            renewingServiceId = null;
            renewSelectedPeriod = 'ay';

            const selector =
                document.getElementById(
                    'renewPeriodSelector'
                );

            if (selector) {
                selector.classList.add(
                    'hidden'
                );
            }

            const title =
                document.getElementById(
                    'cartModalTitle'
                );

            if (title) {
                title.textContent =
                    'Sepet & Ödeme';
            }
        }

        updateCartBadge();
        renderCart();
    }

    function updateCartBadge() {
        const badge =
            document.getElementById(
                'cartCountBadge'
            );

        if (badge) {
            badge.textContent =
                cart.length;
        }
    }

    function openCartModal() {
        const renewalItem =
            cart.find(
                item =>
                    item.mode === 'renewal' &&
                    item.serviceId
            );

        const title =
            document.getElementById(
                'cartModalTitle'
            );

        const selector =
            document.getElementById(
                'renewPeriodSelector'
            );

        if (renewalItem) {
            renewingServiceId =
                Number(
                    renewalItem.serviceId
                );

            renewingServiceIndex =
                userServices.findIndex(
                    service =>
                        Number(service.id) ===
                        Number(renewingServiceId)
                );

            if (title) {
                title.textContent =
                    'Hizmet Yenileme';
            }

            const service =
                userServices.find(
                    service =>
                        Number(service.id) ===
                        Number(renewingServiceId)
                );

            if (selector) {
                if (
                    service &&
                    service.type !== 'domain'
                ) {
                    selector.classList.remove(
                        'hidden'
                    );
                } else {
                    selector.classList.add(
                        'hidden'
                    );
                }
            }

            if (renewalItem.period) {
                renewSelectedPeriod =
                    renewalItem.period;
            }

            updateRenewPeriodButtons();

        } else {
            if (title) {
                title.textContent =
                    'Sepet & Ödeme';
            }

            if (selector) {
                selector.classList.add(
                    'hidden'
                );
            }
        }

        renderCart();

        const modal =
            document.getElementById(
                'cartModal'
            );

        if (modal) {
            modal.classList.remove(
                'hidden'
            );
        }
    }
    function closeCartModal() {
        const modal =
            document.getElementById(
                'cartModal'
            );

        if (modal) {
            modal.classList.add(
                'hidden'
            );
        }

        // DİKKAT:
        // Yenileme bilgisini burada sıfırlamıyoruz.
        // Sepet tekrar açılırsa hangi hizmetin
        // yenilendiğini hatırlaması gerekiyor.
    }

    function renderCart() {
        const list =
            document.getElementById(
                'cartItemsList'
            );

        const section =
            document.getElementById(
                'checkoutSection'
            );

        if (
            !list ||
            !section
        ) {
            return;
        }

        if (cart.length === 0) {
            list.innerHTML = `
                <p class="text-sm text-slate-500 text-center py-6">
                    Sepet boş
                </p>
            `;

            section.classList.add(
                'hidden'
            );

            return;
        }

        let total = 0;

        list.innerHTML =
            cart.map(
                (item, index) => {

                    total +=
                        Number(
                            item.price || 0
                        );

                    const isRenewal =
                        item.mode ===
                        'renewal';

                    return `
                        <div class="flex justify-between items-center bg-slate-50 p-4 rounded-xl">

                            <div>

                                <div class="font-medium text-sm text-slate-800">
                                    ${item.name}
                                </div>

                                <div class="text-xs text-sky-600 font-medium mt-0.5">
                                    ₺${Number(item.price).toFixed(2)}
                                    /
                                    ${item.period}
                                </div>

                                ${
                                    isRenewal
                                        ? `
                                            <div class="mt-1">
                                                <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                    <i class="fa-solid fa-rotate"></i>
                                                    Hizmet Yenileme
                                                </span>
                                            </div>
                                        `
                                        : ''
                                }

                            </div>

                            <button
                                type="button"
                                onclick="removeFromCart(${index})"
                                class="text-red-400 hover:text-red-600 text-sm"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>

                        </div>
                    `;
                }
            ).join('') +

            `
                <div class="flex justify-between font-bold pt-4 border-t border-slate-200">

                    <span>
                        Toplam
                    </span>

                    <span class="text-sky-600">
                        ₺${total.toFixed(2)}
                    </span>

                </div>
            `;

        section.classList.remove(
            'hidden'
        );
    }


    // ======================================================
    // HİZMETLER
    // ======================================================

    function saveUserServices() {
        const key =
            getUserKey();

        if (key) {

            localStorage.setItem(
                'vortex_services_' +
                key,

                JSON.stringify(
                    userServices
                )
            );
        }
    }

    async function loadUserServices() {
        const token =
            localStorage.getItem(
                'vortex_token'
            );

        if (!token) {
            userServices = [];
            return;
        }

        try {

            const response =
                await fetch(
                    'https://anazhosting-backend.onrender.com/api/services',
                    {
                        headers: {
                            'Authorization':
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                console.error(
                    'Hizmetler alınamadı:',
                    data.message
                );

                userServices = [];

                return;
            }

            userServices =
                data.services.map(
                    service => ({
                        ...service,

                        expiryDate:
                            service.expiry_date,

                        purchaseDate:
                            service.created_at
                    })
                );

        } catch (error) {

            console.error(
                'Backend hizmet hatası:',
                error
            );

            userServices = [];
        }
    }

    function openServiceDetail(index) {
        const service =
            userServices[index];

        if (!service) {
            showToast(
                'Hata',
                'Hizmet bulunamadı.'
            );

            return;
        }
            // SSL hizmetleri özel SSL yönetim ekranına gider
    if (service.type === 'ssl') {
        openSslManager(index);
        return;
    }


        // ======================================================
        // TEMEL BİLGİLER
        // ======================================================

        const days =
            getDaysLeft(
                service.expiryDate
            );

        const type =
            service.type ||
            detectServiceType(
                service.name
            );

        const isDomain =
            type === 'domain';

        const isCancelled =
            service.status ===
            'İptal Edildi';

        const isExpired =
            service.status ===
            'Süresi Doldu';


        // ======================================================
        // DURUM RENGİ
        // ======================================================

        let statusClass =
            'bg-emerald-50 text-emerald-600';

        if (isExpired) {
            statusClass =
                'bg-amber-50 text-amber-600';
        }

        if (isCancelled) {
            statusClass =
                'bg-red-50 text-red-600';
        }


        // ======================================================
        // DOMAIN VARSAYILAN BİLGİLER
        // ======================================================

        if (isDomain) {

            if (!service.nameservers) {
                service.nameservers = [
                    'ns1.anazhosting.com.tr',
                    'ns2.anazhosting.com.tr'
                ];
            }

            if (!service.dns) {
                service.dns = [
                    {
                        type: 'A',
                        name: '@',
                        value: '185.199.108.153',
                        ttl: 3600
                    },
                    {
                        type: 'CNAME',
                        name: 'www',
                        value: '@',
                        ttl: 3600
                    }
                ];
            }

            if (
                typeof service.transferLock ===
                'undefined'
            ) {
                service.transferLock =
                    true;
            }

            if (!service.redirectUrl) {
                service.redirectUrl =
                    '';
            }
        }


        // ======================================================
        // SORUMLU BİLGİLERİ
        // ======================================================

        if (!service.responsible) {
            service.responsible = {
                name:
                    currentUser?.name ||
                    '-',

                email:
                    currentUser?.email ||
                    '-',

                phone:
                    '-'
            };
        }


        // ======================================================
        // LOGLAR
        // ======================================================

        if (!service.logs) {
            service.logs = [];
        }


        // ======================================================
        // HOSTING / VDS PANEL BİLGİLERİ
        // ======================================================

        if (
            type === 'hosting' ||
            type === 'vds'
        ) {

            if (!service.panelUrl) {
                service.panelUrl =
                    'https://panel.anazhosting.com.tr';
            }

            if (!service.panelUser) {
                service.panelUser =
                    currentUser?.email ||
                    '-';
            }
        }


        // ======================================================
        // HOSTING BİLGİLERİ
        // ======================================================

        if (
            type === 'hosting'
        ) {

            if (!service.ftpHost) {
                service.ftpHost =
                    'ftp.anazhosting.com.tr';
            }

            if (!service.ftpUser) {
                service.ftpUser =
                    (
                        service.panelUser ||
                        'kullanici'
                    )
                        .split('@')[0];
            }

            if (!service.diskUsed) {
                service.diskUsed =
                    '0.4';
            }

            if (!service.diskLimit) {
                service.diskLimit =
                    service.name.includes(
                        'Limitsiz'
                    )
                        ? 'Sınırsız'
                        : '5';
            }

            if (!service.files) {
                service.files = [
                    {
                        name: 'public_html',
                        type: 'folder',
                        size: '—'
                    },
                    {
                        name: 'index.html',
                        type: 'file',
                        size: '2 KB'
                    },
                    {
                        name: 'error_log',
                        type: 'file',
                        size: '12 KB'
                    },
                    {
                        name: 'mail',
                        type: 'folder',
                        size: '—'
                    },
                    {
                        name: 'ssl',
                        type: 'folder',
                        size: '—'
                    }
                ];
            }

            if (!service.databases) {
                service.databases = [];
            }
        }


        // ======================================================
        // VDS BİLGİLERİ
        // ======================================================

        if (
            type === 'vds'
        ) {

            if (!service.serverIp) {
                service.serverIp =
                    '— (kurulum sonrası atanır)';
            }

            if (!service.rootUser) {
                service.rootUser =
                    'root';
            }

            if (!service.os) {
                service.os =
                    'Ubuntu 22.04';
            }
        }


        // ======================================================
        // E-POSTA BİLGİLERİ
        // ======================================================

        if (
            type === 'email'
        ) {

            if (!service.webmailUrl) {
                service.webmailUrl =
                    'https://webmail.anazhosting.com.tr';
            }

            if (!service.mailboxes) {
                service.mailboxes = [];
            }

            if (!service.mailDomain) {
                service.mailDomain =
                    '';
            }
        }


        // ======================================================
        // SSL BİLGİLERİ
        // ======================================================

        if (
            type === 'ssl'
        ) {

            if (!service.sslDomain) {
                service.sslDomain =
                    '';
            }

            if (!service.sslStatus) {
                service.sslStatus =
                    'Kurulum bekleniyor';
            }
        }


        // ======================================================
        // AKTİF SEKME
        // ======================================================

        const tab =
            window._serviceDetailTab ||
            'genel';


        // ======================================================
        // HİZMET TÜRÜ
        // ======================================================

        const typeLabel = {
            domain:
                'Domain',

            hosting:
                'Hosting',

            vds:
                'VDS / Sunucu',

            ssl:
                'SSL Sertifikası',

            email:
                'Kurumsal E-Posta'
        }[type] || 'Hizmet';


        const typeIcon = {
            domain:
                'fa-globe',

            hosting:
                'fa-server',

            vds:
                'fa-microchip',

            ssl:
                'fa-lock',

            email:
                'fa-envelope'
        }[type] || 'fa-server';


        // ======================================================
        // SEKMELER
        // ======================================================

        let tabs = [
            {
                id:
                    'genel',

                icon:
                    'fa-circle-info',

                label:
                    'Genel Bilgiler'
            }
        ];


        // ======================================================
        // DOMAIN SEKMELERİ
        // ======================================================

        if (
            type === 'domain'
        ) {

            tabs = tabs.concat([
                {
                    id:
                        'ns',

                    icon:
                        'fa-server',

                    label:
                        'İsim Sunucuları / NS'
                },
                {
                    id:
                        'whois',

                    icon:
                        'fa-user',

                    label:
                        'Sorumlu / Whois'
                },
                {
                    id:
                        'kilit',

                    icon:
                        'fa-lock',

                    label:
                        'Transfer Kilidi'
                },
                {
                    id:
                        'dns',

                    icon:
                        'fa-network-wired',

                    label:
                        'DNS Yönetimi'
                },
                {
                    id:
                        'yonlendirme',

                    icon:
                        'fa-arrow-right',

                    label:
                        'URL Yönlendirme'
                }
            ]);
        }


        // ======================================================
        // HOSTING SEKMELERİ
        // ======================================================

        else if (
            type === 'hosting'
        ) {

            tabs = tabs.concat([
                {
                    id:
                        'panel',

                    icon:
                        'fa-gauge-high',

                    label:
                        'Kontrol Paneli'
                },
                {
                    id:
                        'erisim',

                    icon:
                        'fa-key',

                    label:
                        'Erişim Bilgileri'
                },
                {
                    id:
                        'dosyalar',

                    icon:
                        'fa-folder-open',

                    label:
                        'Dosyalar / FTP'
                },
                {
                    id:
                        'veritabani',

                    icon:
                        'fa-database',

                    label:
                        'Veritabanı'
                }
            ]);
        }


        // ======================================================
        // VDS SEKMELERİ
        // ======================================================

        else if (
            type === 'vds'
        ) {

            tabs = tabs.concat([
                {
                    id:
                        'sunucu',

                    icon:
                        'fa-microchip',

                    label:
                        'Sunucu Bilgileri'
                },
                {
                    id:
                        'panel',

                    icon:
                        'fa-gauge-high',

                    label:
                        'Kontrol Paneli'
                },
                {
                    id:
                        'erisim',

                    icon:
                        'fa-key',

                    label:
                        'Erişim Bilgileri'
                }
            ]);
        }


        // ======================================================
        // MAİL SEKMELERİ
        // ======================================================

        else if (
            type === 'email'
        ) {

            tabs = tabs.concat([
                {
                    id:
                        'webmail',

                    icon:
                        'fa-envelope-open-text',

                    label:
                        'Webmail'
                },
                {
                    id:
                        'kutular',

                    icon:
                        'fa-inbox',

                    label:
                        'E-Posta Kutuları'
                },
                {
                    id:
                        'kurulum',

                    icon:
                        'fa-gear',

                    label:
                        'Outlook / Telefon'
                }
            ]);
        }


        // ======================================================
        // SSL SEKMELERİ
        // ======================================================

        else if (
            type === 'ssl'
        ) {

            tabs = tabs.concat([
                {
                    id:
                        'sertifika',

                    icon:
                        'fa-shield-halved',

                    label:
                        'Sertifika Bilgisi'
                },
                {
                    id:
                        'kurulum_ssl',

                    icon:
                        'fa-wrench',

                    label:
                        'Kurulum'
                }
            ]);
        }


        // Her hizmette loglar
        tabs.push({
            id:
                'loglar',

            icon:
                'fa-list',

            label:
                'İşlem Kayıtları'
        });


        // ======================================================
        // SEKME İÇERİĞİ
        // ======================================================

        let body = '';


        // ======================================================
        // GENEL
        // ======================================================

        if (
            tab === 'genel'
        ) {

    body = `
        <div class="space-y-6">

            <!-- ÜST BİLGİ KARTLARI -->

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div class="bg-slate-50 border border-slate-100 rounded-2xl p-5">

                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Kalan Süre
                    </p>

                    <div class="flex items-end gap-2 mt-3">

                        <span class="text-3xl font-extrabold text-slate-900">
                            ${
                                isCancelled
                                    ? '—'
                                    : days
                            }
                        </span>

                        ${
                            !isCancelled
                                ? `
                                    <span class="text-sm font-medium text-slate-500 mb-1">
                                        gün
                                    </span>
                                `
                                : ''
                        }

                    </div>

                </div>


                <div class="bg-slate-50 border border-slate-100 rounded-2xl p-5">

                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Bitiş Tarihi
                    </p>

                    <p class="text-xl font-extrabold text-slate-900 mt-3 whitespace-nowrap">
                        ${formatDate(service.expiryDate)}
                    </p>

                </div>


                <div class="bg-slate-50 border border-slate-100 rounded-2xl p-5">

                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Satın Alma
                    </p>

                    <p class="text-xl font-extrabold text-slate-900 mt-3 whitespace-nowrap">
                        ${formatDate(service.purchaseDate)}
                    </p>

                </div>

            </div>


            <!-- HİZMET ÖZETİ -->

            <div class="border border-slate-200 rounded-2xl p-5">

                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-5">
                    Hizmet Özeti
                </h3>


                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                    <div>

                        <p class="text-xs text-slate-400 mb-1">
                            Hizmet
                        </p>

                        <p class="font-semibold text-slate-800">
                            ${service.name}
                        </p>

                    </div>


                    <div>

                        <p class="text-xs text-slate-400 mb-1">
                            Tür
                        </p>

                        <p class="font-semibold text-slate-800">
                            ${typeLabel}
                        </p>

                    </div>


                    <div>

                        <p class="text-xs text-slate-400 mb-1">
                            Ücret
                        </p>

                        <p class="font-semibold text-slate-800">
                            ₺${Number(service.price || 0).toFixed(2)}
                            /
                            ${service.period || '-'}
                        </p>

                    </div>


                    <div>

                        <p class="text-xs text-slate-400 mb-1">
                            Durum
                        </p>

                        <span
                            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                isCancelled
                                    ? 'bg-red-50 text-red-600'
                                    : isExpired
                                        ? 'bg-amber-50 text-amber-600'
                                        : 'bg-emerald-50 text-emerald-600'
                            }"
                        >
                            ${service.status}
                        </span>

                    </div>

                </div>

            </div>

        </div>
    `;
}

        // ======================================================
        // NAMESERVER
        // ======================================================

        else if (
            tab === 'ns'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase mb-2">
                        İsim Sunucuları (Nameserver)
                    </h3>

                    <p class="text-sm text-slate-500 mb-5">
                        Değişiklikler 24–48 saat içinde yayılabilir.
                    </p>

                    <div class="space-y-3">

                        <div>

                            <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                                NS1
                            </label>

                            <input
                                id="ns1Input"
                                type="text"
                                value="${(service.nameservers || [])[0] || ''}"
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                            >

                        </div>


                        <div>

                            <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                                NS2
                            </label>

                            <input
                                id="ns2Input"
                                type="text"
                                value="${(service.nameservers || [])[1] || ''}"
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                            >

                        </div>

                    </div>

                    <button
                        onclick="saveNameservers(${index})"
                        class="mt-5 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
                    >
                        Kaydet
                    </button>

                </div>
            `;
        }


        // ======================================================
        // WHOIS
        // ======================================================

        else if (
            tab === 'whois'
        ) {

            const responsible =
                service.responsible ||
                {};

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase mb-2">
                        Sorumlu Bilgileri / Whois
                    </h3>

                    <div class="space-y-3 mt-4">

                        <div>

                            <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                                Ad Soyad
                            </label>

                            <input
                                id="whoisName"
                                type="text"
                                value="${responsible.name || ''}"
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                            >

                        </div>


                        <div>

                            <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                                E-posta
                            </label>

                            <input
                                id="whoisEmail"
                                type="email"
                                value="${responsible.email || ''}"
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                            >

                        </div>


                        <div>

                            <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                                Telefon
                            </label>

                            <input
                                id="whoisPhone"
                                type="text"
                                value="${responsible.phone || ''}"
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                            >

                        </div>

                    </div>


                    <button
                        onclick="saveWhois(${index})"
                        class="mt-5 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
                    >
                        Kaydet
                    </button>

                </div>
            `;
        }


        // ======================================================
        // TRANSFER KİLİDİ
        // ======================================================

        else if (
            tab === 'kilit'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase mb-2">
                        Transfer Kilidi
                    </h3>

                    <p class="text-sm text-slate-500 mb-5">
                        Kilit açıkken domain başka firmaya transfer edilemez.
                    </p>

                    <div class="flex items-center justify-between bg-slate-50 rounded-xl p-5">

                        <div>

                            <p class="font-semibold text-slate-800">
                                Transfer Kilidi
                            </p>

                            <p class="text-xs mt-1 font-medium ${
                                service.transferLock
                                    ? 'text-emerald-600'
                                    : 'text-amber-600'
                            }">

                                ${
                                    service.transferLock
                                        ? 'Açık – Domain korunuyor'
                                        : 'Kapalı – Transfer edilebilir'
                                }

                            </p>

                        </div>


                        <button
                            onclick="toggleTransferLock(${index})"
                            class="relative w-12 h-6 rounded-full transition ${
                                service.transferLock
                                    ? 'bg-sky-500'
                                    : 'bg-slate-300'
                            }"
                        >

                            <span
                                class="absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                                    service.transferLock
                                        ? 'left-7'
                                        : 'left-1'
                                }"
                            ></span>

                        </button>

                    </div>

                </div>
            `;
        }


        // ======================================================
        // DNS
        // ======================================================

        else if (
            tab === 'dns'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">

                        <div>

                            <h3 class="text-sm font-semibold text-slate-500 uppercase">
                                DNS Yönetimi
                            </h3>

                            <p class="text-sm text-slate-500 mt-1">
                                A, CNAME, MX, TXT kayıtları
                            </p>

                        </div>


                        <button
                            onclick="showAddDnsForm(${index})"
                            class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
                        >
                            + Kayıt Ekle
                        </button>

                    </div>


                    <div
                        id="addDnsForm"
                        class="hidden mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3"
                    >

                        <select
                            id="dnsType"
                            class="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                        >
                            <option value="A">A</option>
                            <option value="AAAA">AAAA</option>
                            <option value="CNAME">CNAME</option>
                            <option value="MX">MX</option>
                            <option value="TXT">TXT</option>
                            <option value="NS">NS</option>
                        </select>


                        <input
                            id="dnsName"
                            placeholder="İsim (@, www...)"
                            class="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                        >


                        <input
                            id="dnsValue"
                            placeholder="Değer"
                            class="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                        >


                        <button
                            onclick="addDnsRecord(${index})"
                            class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
                        >
                            Ekle
                        </button>

                    </div>

                    <div
    id="editDnsForm"
    class="hidden mb-4 p-4 bg-sky-50 rounded-xl border border-sky-200"
>
    <div class="flex items-center justify-between mb-4">

        <div>
            <h4 class="text-sm font-bold text-slate-800">
                DNS Kaydını Düzenle
            </h4>

            <p class="text-xs text-slate-500 mt-1">
                Kayıt bilgilerini değiştirip kaydedebilirsiniz.
            </p>
        </div>

        <button
            onclick="cancelEditDnsRecord()"
            class="w-8 h-8 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>

    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">

        <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                Tip
            </label>

            <select
                id="editDnsType"
                onchange="toggleEditDnsPriority()"
                class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            >
                <option value="A">A</option>
                <option value="AAAA">AAAA</option>
                <option value="CNAME">CNAME</option>
                <option value="MX">MX</option>
                <option value="TXT">TXT</option>
                <option value="NS">NS</option>
            </select>
        </div>


        <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                İsim
            </label>

            <input
                id="editDnsName"
                type="text"
                placeholder="@, www..."
                class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            >
        </div>


        <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                Değer
            </label>

            <input
                id="editDnsValue"
                type="text"
                placeholder="DNS değeri"
                class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            >
        </div>


        <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                TTL
            </label>

            <input
                id="editDnsTtl"
                type="number"
                min="60"
                max="86400"
                value="3600"
                class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            >
        </div>


        <div
            id="editDnsPriorityBox"
            class="hidden"
        >
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                MX Öncelik
            </label>

            <input
                id="editDnsPriority"
                type="number"
                min="0"
                max="65535"
                value="10"
                class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            >
        </div>

    </div>


                        <div class="flex items-center gap-3 mt-4">

                            <button
                                onclick="saveEditedDnsRecord()"
                                class="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
                            >
                                <i class="fa-solid fa-floppy-disk mr-1"></i>
                                Değişiklikleri Kaydet
                            </button>

                            <button
                                onclick="cancelEditDnsRecord()"
                                class="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold"
                            >
                                İptal
                            </button>

                        </div>

                    </div>
                    <div class="overflow-x-auto">

                        <table class="w-full text-sm">

                            <thead>

                                <tr class="text-left text-xs font-semibold text-slate-400 uppercase border-b border-slate-100">

                                    <th class="pb-3 pr-4">
                                        Tip
                                    </th>

                                    <th class="pb-3 pr-4">
                                        İsim
                                    </th>

                                    <th class="pb-3 pr-4">
                                        Değer
                                    </th>

                                    <th class="pb-3 pr-4">
                                        TTL
                                    </th>

                                    <th class="pb-3"></th>

                                </tr>

                            </thead>


                            <tbody>

                                ${
                                    (service.dns || [])
                                        .map(
                                            (record, dnsIndex) => `
                                                <tr class="border-b border-slate-50">

                                                    <td class="py-3 pr-4 font-semibold text-sky-600">
                                                        ${record.type}
                                                    </td>

                                                    <td class="py-3 pr-4">
                                                        ${record.name}
                                                    </td>

                                                    <td class="py-3 pr-4 font-mono text-xs break-all">
                                                        ${record.value}
                                                    </td>

                                                    <td class="py-3 pr-4 text-slate-500">
                                                        ${record.ttl || 3600}
                                                    </td>

                                                    <td class="py-3 text-right">

                                             <div class="flex items-center justify-end gap-3">

                                            <button
                                                onclick="editDnsRecord(${index}, ${record.id})"
                                                class="text-sky-500 hover:text-sky-700 text-xs font-semibold"
                                            >
                                                Düzenle
                                            </button>

                                            <button
                                                onclick="removeDnsRecord(${index}, ${record.id})"
                                                class="text-red-400 hover:text-red-600 text-xs font-semibold"
                                            >
                                                Sil
                                            </button>

                            </div>
                                            `
                                        )
                                        .join('') ||

                                    `
                                        <tr>
                                            <td
                                                colspan="5"
                                                class="py-8 text-center text-slate-400"
                                            >
                                                Kayıt yok
                                            </td>
                                        </tr>
                                    `
                                }

                            </tbody>

                        </table>

                    </div>

                </div>
            `;
        }


        // ======================================================
        // URL YÖNLENDİRME
        // ======================================================

        else if (
            tab === 'yonlendirme'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase mb-2">
                        URL Yönlendirme
                    </h3>

                    <p class="text-sm text-slate-500 mb-5">
                        Domaininizi başka bir adrese yönlendirin.
                    </p>


                    <input
                        id="redirectInput"
                        type="url"
                        value="${service.redirectUrl || ''}"
                        placeholder="https://"
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                    >


                    <button
                        onclick="saveRedirect(${index})"
                        class="mt-5 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
                    >
                        Kaydet
                    </button>


                    ${
                        service.redirectUrl
                            ? `
                                <p class="mt-3 text-sm text-emerald-600">
                                    Aktif:

                                    <span class="font-medium">
                                        ${service.redirectUrl}
                                    </span>
                                </p>
                            `
                            : ''
                    }

                </div>
            `;
        }


        // ======================================================
        // PANEL
        // ======================================================

        else if (
            tab === 'panel'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase mb-2">
                        Kontrol Paneli
                    </h3>

                    <p class="text-sm text-slate-500 mb-5">
                        cPanel / yönetim paneline buradan ulaşabilirsiniz.
                    </p>


                    <div class="bg-slate-50 rounded-xl p-5 space-y-3 text-sm">

                        <div class="flex justify-between gap-4">

                            <span class="text-slate-400">
                                Panel adresi
                            </span>

                            <a
                                href="${service.panelUrl}"
                                target="_blank"
                                class="text-sky-600 font-medium hover:underline break-all"
                            >
                                ${service.panelUrl}
                            </a>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                Kullanıcı
                            </span>

                            <span class="font-medium">
                                ${service.panelUser || '-'}
                            </span>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                Şifre
                            </span>

                            <span class="text-slate-400">
                                Kayıt e-postanızda
                            </span>

                        </div>

                    </div>


                    <a
                        href="${service.panelUrl}"
                        target="_blank"
                        class="inline-flex mt-5 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
                    >
                        Panele Git
                    </a>

                </div>
            `;
        }


        // ======================================================
        // ERİŞİM BİLGİLERİ
        // ======================================================

        else if (
            tab === 'erisim'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase mb-2">
                        Erişim Bilgileri
                    </h3>

                    <p class="text-sm text-slate-500 mb-5">
                        FTP ve panel giriş bilgileri
                    </p>


                    <div class="bg-slate-50 rounded-xl p-5 space-y-3 text-sm">

                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                FTP Host
                            </span>

                            <span class="font-mono font-medium">
                                ${service.ftpHost || 'ftp.anazhosting.com.tr'}
                            </span>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                FTP Port
                            </span>

                            <span class="font-mono font-medium">
                                21
                            </span>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                Kullanıcı adı
                            </span>

                            <span class="font-medium">
                                ${service.ftpUser || service.panelUser || '-'}
                            </span>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                Şifre
                            </span>

                            <span class="text-slate-400">
                                Kurulum mailinde gönderilir
                            </span>

                        </div>

                    </div>

                </div>
            `;
        }


        // ======================================================
        // DOSYALAR
        // ======================================================

   else if (
    tab === 'dosyalar'
) {
    const ftpAccounts =
        Array.isArray(
            service.ftpAccounts
        )
            ? service.ftpAccounts
            : [];

    body = `
        <div class="space-y-5">


            <!-- FTP HESABI OLUŞTUR -->

            <div class="border border-slate-200 rounded-xl p-5">

                <div class="mb-5">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase">
                        FTP Hesabı Oluştur
                    </h3>

                    <p class="text-sm text-slate-500 mt-1">
                        Hosting hesabınız için yeni FTP kullanıcısı oluşturun.
                    </p>

                </div>


                <div class="grid md:grid-cols-2 gap-4">

                    <div>

                        <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                            Kullanıcı Adı
                        </label>

                        <input
                            id="ftpUsernameInput"
                            type="text"
                            placeholder="ornekftp"
                            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-400"
                        >

                    </div>


                    <div>

                        <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                            Şifre
                        </label>

                        <input
                            id="ftpPasswordInput"
                            type="password"
                            placeholder="En az 8 karakter"
                            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-400"
                        >

                    </div>


                    <div>

                        <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                            Ana Dizin
                        </label>

                        <input
                            id="ftpDirectoryInput"
                            type="text"
                            value="/public_html"
                            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-sky-400"
                        >

                    </div>


                    <div>

                        <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                            Kota (MB)
                        </label>

                        <input
                            id="ftpQuotaInput"
                            type="number"
                            value="1024"
                            min="100"
                            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-400"
                        >

                    </div>

                </div>


                <button
                    onclick="addFtpAccount(${index})"
                    class="mt-4 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
                >
                    <i class="fa-solid fa-plus mr-2"></i>
                    FTP Hesabı Oluştur
                </button>

            </div>


            <!-- FTP BAĞLANTI BİLGİLERİ -->

            <div class="border border-slate-200 rounded-xl p-5">

                <h3 class="text-sm font-semibold text-slate-500 uppercase mb-4">
                    FTP Bağlantı Bilgileri
                </h3>


                <div class="grid sm:grid-cols-3 gap-3">

                    <div class="bg-slate-50 rounded-xl p-4">

                        <p class="text-xs text-slate-400 mb-1">
                            FTP Host
                        </p>

                        <p class="font-mono text-sm font-medium text-slate-800">
                            ${service.ftpHost || 'ftp.anazhosting.com.tr'}
                        </p>

                    </div>


                    <div class="bg-slate-50 rounded-xl p-4">

                        <p class="text-xs text-slate-400 mb-1">
                            Port
                        </p>

                        <p class="font-mono text-sm font-medium text-slate-800">
                            21
                        </p>

                    </div>


                    <div class="bg-slate-50 rounded-xl p-4">

                        <p class="text-xs text-slate-400 mb-1">
                            Protokol
                        </p>

                        <p class="text-sm font-medium text-slate-800">
                            FTP
                        </p>

                    </div>

                </div>

            </div>


            <!-- FTP HESAPLARI -->

            <div class="border border-slate-200 rounded-xl p-5">

                <div class="mb-4">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase">
                        FTP Hesapları
                    </h3>

                    <p class="text-sm text-slate-500 mt-1">
                        Oluşturduğunuz FTP hesaplarını yönetin.
                    </p>

                </div>


                <div class="space-y-4">

                    ${
                        ftpAccounts.length

                            ? ftpAccounts
                                .map(
                                    ftp => `
                                        <div class="border border-slate-200 rounded-xl p-4">

                                            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">

                                                <div>

                                                    <div class="flex items-center gap-2">

                                                        <i class="fa-solid fa-user text-sky-500"></i>

                                                        <span class="font-semibold text-slate-800">
                                                            ${ftp.username}
                                                        </span>

                                                        <span class="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">
                                                            ${ftp.status || 'Aktif'}
                                                        </span>

                                                    </div>

                                                    <p class="text-xs text-slate-400 mt-1">
                                                        Oluşturulma:
                                                        ${
                                                            ftp.created_at
                                                                ? new Date(
                                                                    String(
                                                                        ftp.created_at
                                                                    ).replace(
                                                                        ' ',
                                                                        'T'
                                                                    )
                                                                ).toLocaleString(
                                                                    'tr-TR'
                                                                )
                                                                : '-'
                                                        }
                                                    </p>

                                                </div>


                                                <button
                                                    onclick="removeFtpAccount(${index}, ${ftp.id})"
                                                    class="px-3 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold"
                                                >
                                                    <i class="fa-solid fa-trash mr-1"></i>
                                                    Sil
                                                </button>

                                            </div>


                                            <div class="grid md:grid-cols-2 gap-4">


                                                <!-- DİZİN -->

                                                <div>

                                                    <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                                                        Ana Dizin
                                                    </label>

                                                    <div class="flex gap-2">

                                                        <input
                                                            id="ftpDirectory-${ftp.id}"
                                                            value="${ftp.directory || '/public_html'}"
                                                            class="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                                                        >

                                                        <button
                                                            onclick="changeFtpDirectory(${index}, ${ftp.id})"
                                                            class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold"
                                                        >
                                                            Kaydet
                                                        </button>

                                                    </div>

                                                </div>


                                                <!-- KOTA -->

                                                <div>

                                                    <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                                                        Kota (MB)
                                                    </label>

                                                    <div class="flex gap-2">

                                                        <input
                                                            id="ftpQuota-${ftp.id}"
                                                            type="number"
                                                            value="${ftp.quota_mb || 1024}"
                                                            class="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                                        >

                                                        <button
                                                            onclick="changeFtpQuota(${index}, ${ftp.id})"
                                                            class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold"
                                                        >
                                                            Kaydet
                                                        </button>

                                                    </div>

                                                </div>


                                                <!-- ŞİFRE -->

                                                <div class="md:col-span-2">

                                                    <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                                                        Yeni Şifre
                                                    </label>

                                                    <div class="flex gap-2">

                                                        <input
                                                            id="ftpPassword-${ftp.id}"
                                                            type="password"
                                                            placeholder="Yeni FTP şifresi"
                                                            class="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                                        >

                                                        <button
                                                            onclick="changeFtpPassword(${index}, ${ftp.id})"
                                                            class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold"
                                                        >
                                                            Şifreyi Değiştir
                                                        </button>

                                                    </div>

                                                </div>

                                            </div>

                                        </div>
                                    `
                                )
                                .join('')

                            : `
                                <div class="text-center py-10">

                                    <i class="fa-solid fa-users text-3xl text-slate-200 mb-3"></i>

                                    <p class="text-sm text-slate-400">
                                        Henüz FTP hesabı oluşturulmadı.
                                    </p>

                                </div>
                            `
                    }

                </div>

            </div>


            <div class="bg-amber-50 border border-amber-100 text-amber-800 text-xs rounded-xl px-4 py-3">

                <i class="fa-solid fa-circle-info mr-1"></i>

               Şu an FTP hesapları geliştirme ortamında ANAZHOSTING veritabanında yönetiliyor.

            </div>

        </div>
    `;
}


        // ======================================================
        // VERİTABANI
        // ======================================================

        else if (
            tab === 'veritabani'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">

                        <div>

                            <h3 class="text-sm font-semibold text-slate-500 uppercase">
                                Veritabanları
                            </h3>

                            <p class="text-sm text-slate-500 mt-1">
                                MySQL veritabanı oluşturun
                            </p>

                        </div>


                        <button
                            onclick="addDatabase(${index})"
                            class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
                        >
                            + Veritabanı Ekle
                        </button>

                    </div>


                    <div class="space-y-2">

                        ${
                            (service.databases || [])
                                .map(
                                    (database, dbIndex) => `
                                        <div class="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 text-sm">

                                            <div>

                                                <span class="font-medium text-slate-800">
                                                    ${database.name}
                                                </span>

                                                <span class="text-slate-400 ml-2 text-xs">
                                                    ${database.user}
                                                </span>

                                            </div>


                                            <button
                                                onclick="removeDatabase(${index}, ${dbIndex})"
                                                class="text-red-400 hover:text-red-600 text-xs font-semibold"
                                            >
                                                Sil
                                            </button>

                                        </div>
                                    `
                                )
                                .join('') ||

                            `
                                <p class="text-sm text-slate-400 py-6 text-center">
                                    Henüz veritabanı yok
                                </p>
                            `
                        }

                    </div>

                </div>
            `;
        }


        // ======================================================
        // VDS SUNUCU
        // ======================================================

        else if (
            tab === 'sunucu'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase mb-2">
                        Sunucu Bilgileri
                    </h3>


                    <div class="bg-slate-50 rounded-xl p-5 space-y-3 text-sm mt-4">

                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                IP Adresi
                            </span>

                            <span class="font-mono font-medium">
                                ${service.serverIp || '—'}
                            </span>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                Kullanıcı
                            </span>

                            <span class="font-medium">
                                ${service.rootUser || 'root'}
                            </span>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                İşletim Sistemi
                            </span>

                            <span class="font-medium">
                                ${service.os || 'Ubuntu 22.04'}
                            </span>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                Paket
                            </span>

                            <span class="font-medium">
                                ${service.name}
                            </span>

                        </div>

                    </div>

                </div>
            `;
        }


        // ======================================================
        // WEBMAIL
        // ======================================================

        else if (
            tab === 'webmail'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase mb-2">
                        Webmail
                    </h3>

                    <p class="text-sm text-slate-500 mb-5">
                        E-postalarınıza tarayıcıdan ulaşın.
                    </p>


                    <div class="bg-slate-50 rounded-xl p-5 space-y-3 text-sm">

                        <div class="flex justify-between gap-4">

                            <span class="text-slate-400">
                                Webmail
                            </span>

                            <a
                                href="${service.webmailUrl}"
                                target="_blank"
                                class="text-sky-600 font-medium hover:underline break-all"
                            >
                                ${service.webmailUrl}
                            </a>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                Domain
                            </span>

                            <span class="font-medium">
                                ${service.mailDomain || 'Henüz atanmadı'}
                            </span>

                        </div>

                    </div>

                </div>
            `;
        }


        // ======================================================
        // MAİL KUTULARI
        // ======================================================

        else if (
            tab === 'kutular'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">

                        <div>

                            <h3 class="text-sm font-semibold text-slate-500 uppercase">
                                E-Posta Kutuları
                            </h3>

                            <p class="text-sm text-slate-500 mt-1">
                                info@, destek@ gibi hesaplar oluşturun
                            </p>

                        </div>


                        <button
                            onclick="showAddMailboxForm(${index})"
                            class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
                        >
                            + Kutu Ekle
                        </button>

                    </div>


                    <div class="mb-4">

                        <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                            Mail domaini
                        </label>


                        <div class="flex gap-2">

                            <input
                                id="mailDomainInput"
                                type="text"
                                value="${service.mailDomain || ''}"
                                placeholder="ornek.com"
                                class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                            >


                            <button
                                onclick="saveMailDomain(${index})"
                                class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold"
                            >
                                Kaydet
                            </button>

                        </div>

                    </div>

<div
    id="addMailboxForm"
    class="hidden mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3"
>

    <input
        id="mbLocal"
        placeholder="info"
        class="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
    >

    <input
        id="mbPass"
        type="password"
        placeholder="Şifre (en az 8 karakter)"
        class="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
    >

    <input
        id="mbQuota"
        type="number"
        value="1024"
        min="100"
        max="10240"
        placeholder="Kota (MB)"
        class="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
    >

    <button
        onclick="addMailbox(${index})"
        class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
    >
        Ekle
    </button>

</div>


                    <div class="space-y-2">

                 ${
    (service.mailboxes || [])
        .map(
            mailbox => `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-3 text-sm">

                    <div>

                        <div class="font-semibold text-slate-800">
                                        ${mailbox.email}
                                    </div>

                                    <div class="text-xs text-slate-400 mt-1">
                                        Kota:
                                        ${Number(mailbox.quota_mb || 0)} MB
                                        ·
                                        ${mailbox.status || 'Aktif'}
                                    </div>

                                </div>

                                <button
                                    onclick="removeMailbox(${index}, ${mailbox.id})"
                                    class="text-red-400 hover:text-red-600 text-xs font-semibold"
                                >
                                    <i class="fa-solid fa-trash mr-1"></i>
                                    Sil
                                </button>

                            </div>
                        `
                    )
                    .join('') ||

                `
                    <p class="text-sm text-slate-400 py-6 text-center">
                        Henüz mail hesabı oluşturulmamış.
                    </p>
                `
            }
                            `
                        }

                


        // ======================================================
        // OUTLOOK / TELEFON
        // ======================================================

        else if (
            tab === 'kurulum'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase mb-2">
                        Outlook / Telefon Kurulumu
                    </h3>


                    <div class="bg-slate-50 rounded-xl p-5 space-y-3 text-sm">

                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                IMAP sunucu
                            </span>

                            <span class="font-mono">
                                imap.anazhosting.com.tr
                            </span>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                IMAP port
                            </span>

                            <span class="font-mono">
                                993 (SSL)
                            </span>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                SMTP sunucu
                            </span>

                            <span class="font-mono">
                                smtp.anazhosting.com.tr
                            </span>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                SMTP port
                            </span>

                            <span class="font-mono">
                                465 (SSL)
                            </span>

                        </div>

                    </div>

                </div>
            `;
        }


        // ======================================================
        // SSL SERTİFİKA
        // ======================================================

        else if (
            tab === 'sertifika'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase mb-2">
                        Sertifika Bilgisi
                    </h3>


                    <div class="bg-slate-50 rounded-xl p-5 space-y-3 text-sm mt-4">

                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                Paket
                            </span>

                            <span class="font-medium">
                                ${service.name}
                            </span>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                Durum
                            </span>

                            <span class="font-medium">
                                ${service.sslStatus || 'Kurulum bekleniyor'}
                            </span>

                        </div>


                        <div class="flex justify-between">

                            <span class="text-slate-400">
                                Domain
                            </span>

                            <span class="font-medium">
                                ${service.sslDomain || 'Henüz atanmadı'}
                            </span>

                        </div>

                    </div>

                </div>
            `;
        }


        // ======================================================
        // SSL KURULUM
        // ======================================================

        else if (
            tab === 'kurulum_ssl'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase mb-2">
                        SSL Kurulum
                    </h3>


                    <input
                        id="sslDomainInput"
                        type="text"
                        value="${service.sslDomain || ''}"
                        placeholder="ornek.com"
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                    >


                    <button
                        onclick="saveSslDomain(${index})"
                        class="mt-5 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold"
                    >
                        Domaini Kaydet
                    </button>

                </div>
            `;
        }


        // ======================================================
        // LOGLAR
        // ======================================================

        else if (
            tab === 'loglar'
        ) {

            body = `
                <div class="border border-slate-200 rounded-xl p-5">

                    <h3 class="text-sm font-semibold text-slate-500 uppercase mb-4">
                        İşlem Kayıtları
                    </h3>


                    <div class="space-y-3 max-h-72 overflow-y-auto">

                        ${
                            (service.logs || [])
                                .map(
                                    log => `
                                        <div class="flex gap-3 text-sm">

                                            <div class="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></div>

                                            <div>

                                                <p>
                                                    ${log.action}
                                                </p>

                                                <p class="text-xs text-slate-400">
                                                    ${log.date}
                                                </p>

                                            </div>

                                        </div>
                                    `
                                )
                                .join('') ||

                            `
                                <p class="text-sm text-slate-400">
                                    Kayıt yok
                                </p>
                            `
                        }

                    </div>

                </div>
            `;
        }


        // ======================================================
        // ANA DETAY SAYFASI
        // ======================================================

        const html = `
            <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">


                <!-- ÜST BÖLÜM -->

                <div class="px-6 py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">


                    <div class="flex items-center gap-4">

                        <div class="w-14 h-14 rounded-2xl ${
                            isCancelled
                                ? 'bg-red-50'
                                : 'bg-sky-50'
                        } flex items-center justify-center">

                            <i class="fa-solid ${typeIcon} ${
                                isCancelled
                                    ? 'text-red-500'
                                    : 'text-sky-500'
                            } text-xl"></i>

                        </div>


                        <div>

                            <h2 class="text-xl font-bold text-slate-900">
                                ${service.name}
                            </h2>


                            <div class="flex flex-wrap items-center gap-2 mt-1.5">

                                <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass}">
                                    ${service.status}
                                </span>


                                <span class="text-sm text-slate-500">
                                    ${typeLabel}
                                    ·
                                    ₺${Number(service.price || 0).toFixed(2)}
                                    /
                                    ${service.period || '-'}
                                </span>

                            </div>

                        </div>

                    </div>


                    <!-- İŞLEM BUTONLARI -->

                    <div class="flex flex-wrap gap-2">

                        ${
                            !isCancelled

                                ? `
                                    <button
                                        type="button"
                                        onclick="renewService(${index})"
                                        class="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition"
                                    >
                                        <i class="fa-solid fa-rotate mr-1.5"></i>
                                        Yenile
                                    </button>


                                    <button
                                        type="button"
                                        onclick="cancelService(${index})"
                                        class="px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition"
                                    >
                                        <i class="fa-solid fa-ban mr-1.5"></i>
                                        İptal Et
                                    </button>
                                `

                                : `
                                    <div class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold">

                                        <i class="fa-solid fa-circle-xmark"></i>

                                        Hizmet İptal Edildi

                                    </div>
                                `
                        }

                    </div>

                </div>


                <!-- DETAY ALANI -->

                <div class="flex flex-col lg:flex-row min-h-[420px]">


                    <!-- SOL MENÜ -->

                    <aside class="lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-100 p-3 bg-slate-50/50">

                        <nav class="space-y-1">

                            ${
                                tabs.map(
                                    tabItem => `
                                        <button
                                            onclick="setServiceDetailTab('${tabItem.id}', ${index})"
                                            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                                                tab === tabItem.id
                                                    ? 'bg-sky-50 text-sky-700'
                                                    : 'text-slate-600 hover:bg-white'
                                            }"
                                        >

                                            <i class="fa-solid ${tabItem.icon} w-5 text-center text-xs"></i>

                                            ${tabItem.label}

                                        </button>
                                    `
                                ).join('')
                            }

                        </nav>

                    </aside>


                    <!-- SAĞ İÇERİK -->

                    <div class="flex-1 p-6">

                        ${body}

                    </div>

                </div>

            </div>
        `;


        // ======================================================
        // HTML BAS
        // ======================================================

        const detailContent =
            document.getElementById(
                'serviceDetailContent'
            );

        if (detailContent) {
            detailContent.innerHTML =
                html;
        }


        // ======================================================
        // DETAY SAYFASINI AÇ
        // ======================================================

        showDashboardSection(
            'service-detail'
        );
    }
async function loadNameserversFromBackend(index) {

    const service = userServices[index];

    if (!service || service.type !== 'domain' || !service.id) {
        return;
    }

    const token =
        localStorage.getItem('vortex_token');

    if (!token) {
        return;
    }

    try {

const response = await fetch(
    `https://anazhosting-backend.onrender.com/api/services/${service.id}/nameservers`,
    {
        method: 'GET',

        headers: {
            'Authorization': `Bearer ${token}`
        }
    }
);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Nameserver bilgileri alınamadı.'
            );
        }

        const nsData =
            data.nameservers ||
            data.nameserver ||
            data;

        service.nameservers = [
            nsData.ns1 || 'ns1.anazhosting.com.tr',
            nsData.ns2 || 'ns2.anazhosting.com.tr'
        ];

    } catch (error) {

        console.error(
            'NAMESERVER LOAD ERROR:',
            error
        );

        showToast(
            'Nameserver Hatası',
            error.message
        );
    }
}
// ======================================================
// HOSTING FTP - BACKENDDEN YÜKLE
// ======================================================
// ======================================================
// HOSTING VERİTABANI - BACKENDDEN YÜKLE
// ======================================================

async function loadDatabasesFromBackend(index) {
    const service =
        userServices[index];

    if (
        !service ||
        !service.id ||
        service.type !== 'hosting'
    ) {
        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        return;
    }

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/databases`,
                {
                    headers: {
                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Veritabanları alınamadı.'
            );
        }

        service.databases =
            Array.isArray(
                data.databases
            )
                ? data.databases
                : [];

    } catch (error) {
        console.error(
            'DATABASE LOAD ERROR:',
            error
        );

        service.databases = [];

        showToast(
            'Veritabanı Hatası',
            error.message
        );
    }
}


// ======================================================
// VERİTABANI OLUŞTUR
// ======================================================

async function addDatabase(index) {
    const service =
        userServices[index];

    if (
        !service ||
        !service.id ||
        service.type !== 'hosting'
    ) {
        return;
    }

    const databaseName =
        document
            .getElementById(
                'databaseNameInput'
            )
            ?.value
            .trim();

    const databaseUser =
        document
            .getElementById(
                'databaseUserInput'
            )
            ?.value
            .trim();

    const password =
        document
            .getElementById(
                'databasePasswordInput'
            )
            ?.value || '';

    if (!databaseName) {
        showToast(
            'Hata',
            'Veritabanı adı gerekli.'
        );

        return;
    }

    if (!databaseUser) {
        showToast(
            'Hata',
            'Veritabanı kullanıcısı gerekli.'
        );

        return;
    }

    if (
        password.length < 8
    ) {
        showToast(
            'Hata',
            'Şifre en az 8 karakter olmalıdır.'
        );

        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        showToast(
            'Oturum Hatası',
            'Lütfen tekrar giriş yapın.'
        );

        return;
    }

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/databases`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            database_name:
                                databaseName,

                            database_user:
                                databaseUser,

                            password
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Veritabanı oluşturulamadı.'
            );
        }

        await loadDatabasesFromBackend(
            index
        );

        showToast(
            'Oluşturuldu',
            'Veritabanı başarıyla oluşturuldu.'
        );

        window._serviceDetailTab =
            'veritabani';

        openServiceDetail(
            index
        );

    } catch (error) {
        console.error(
            'DATABASE CREATE ERROR:',
            error
        );

        showToast(
            'Veritabanı Hatası',
            error.message
        );
    }
}


// ======================================================
// VERİTABANI ŞİFRESİ DEĞİŞTİR
// ======================================================

async function changeDatabasePassword(
    index,
    databaseId
) {
    const service =
        userServices[index];

    if (
        !service ||
        !service.id
    ) {
        return;
    }

    const password =
        document
            .getElementById(
                `databasePassword-${databaseId}`
            )
            ?.value || '';

    if (
        password.length < 8
    ) {
        showToast(
            'Hata',
            'Yeni şifre en az 8 karakter olmalıdır.'
        );

        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        return;
    }

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/databases/${databaseId}/password`,
                {
                    method: 'PATCH',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            password
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Şifre değiştirilemedi.'
            );
        }

        const input =
            document.getElementById(
                `databasePassword-${databaseId}`
            );

        if (input) {
            input.value = '';
        }

        showToast(
            'Başarılı',
            'Veritabanı şifresi değiştirildi.'
        );

    } catch (error) {
        console.error(
            'DATABASE PASSWORD ERROR:',
            error
        );

        showToast(
            'Veritabanı Hatası',
            error.message
        );
    }
}


// ======================================================
// VERİTABANI SİL
// ======================================================

async function removeDatabase(
    index,
    databaseId
) {
    const service =
        userServices[index];

    if (
        !service ||
        !service.id
    ) {
        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        return;
    }

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/databases/${databaseId}`,
                {
                    method: 'DELETE',

                    headers: {
                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Veritabanı silinemedi.'
            );
        }

        await loadDatabasesFromBackend(
            index
        );

        showToast(
            'Silindi',
            'Veritabanı kaldırıldı.'
        );

        window._serviceDetailTab =
            'veritabani';

        openServiceDetail(
            index
        );

    } catch (error) {
        console.error(
            'DATABASE DELETE ERROR:',
            error
        );

        showToast(
            'Veritabanı Hatası',
            error.message
        );
    }
}
async function loadFtpFromBackend(index) {
    const service = userServices[index];

    if (
        !service ||
        !service.id ||
        service.type !== 'hosting'
    ) {
        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        return;
    }

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/ftp`,
                {
                    headers: {
                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'FTP hesapları alınamadı.'
            );
        }

        service.ftpAccounts =
            Array.isArray(data.accounts)
                ? data.accounts
                : [];

    } catch (error) {
        console.error(
            'FTP LOAD ERROR:',
            error
        );

        service.ftpAccounts = [];

        showToast(
            'FTP Hatası',
            error.message
        );
    }
}


// ======================================================
// FTP HESABI OLUŞTUR
// ======================================================

async function addFtpAccount(index) {
    const service =
        userServices[index];

    if (
        !service ||
        !service.id ||
        service.type !== 'hosting'
    ) {
        return;
    }

    const username =
        document
            .getElementById(
                'ftpUsernameInput'
            )
            ?.value
            .trim();

    const password =
        document
            .getElementById(
                'ftpPasswordInput'
            )
            ?.value || '';

    const directory =
        document
            .getElementById(
                'ftpDirectoryInput'
            )
            ?.value
            .trim() ||
        '/public_html';

    const quotaMb =
        Number(
            document
                .getElementById(
                    'ftpQuotaInput'
                )
                ?.value ||
            1024
        );

    if (!username) {
        showToast(
            'Hata',
            'FTP kullanıcı adı gerekli.'
        );

        return;
    }

    if (
        password.length < 8
    ) {
        showToast(
            'Hata',
            'FTP şifresi en az 8 karakter olmalı.'
        );

        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        showToast(
            'Oturum Hatası',
            'Lütfen tekrar giriş yapın.'
        );

        return;
    }

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/ftp`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            username,
                            password,
                            directory,
                            quota_mb:
                                quotaMb
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'FTP hesabı oluşturulamadı.'
            );
        }

        await loadFtpFromBackend(
            index
        );

        showToast(
            'Oluşturuldu',
            'FTP hesabı oluşturuldu.'
        );

        window._serviceDetailTab =
            'dosyalar';

        openServiceDetail(
            index
        );

    } catch (error) {
        console.error(
            'FTP CREATE ERROR:',
            error
        );

        showToast(
            'FTP Hatası',
            error.message
        );
    }
}


// ======================================================
// FTP HESABINI SİL
// ======================================================

async function removeFtpAccount(
    index,
    ftpId
) {
    const service =
        userServices[index];

    if (
        !service ||
        !service.id
    ) {
        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        return;
    }

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/ftp/${ftpId}`,
                {
                    method: 'DELETE',

                    headers: {
                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'FTP hesabı silinemedi.'
            );
        }

        await loadFtpFromBackend(
            index
        );

        showToast(
            'Silindi',
            'FTP hesabı kaldırıldı.'
        );

        window._serviceDetailTab =
            'dosyalar';

        openServiceDetail(
            index
        );

    } catch (error) {
        console.error(
            'FTP DELETE ERROR:',
            error
        );

        showToast(
            'FTP Hatası',
            error.message
        );
    }
}


// ======================================================
// FTP ŞİFRESİ DEĞİŞTİR
// ======================================================

async function changeFtpPassword(
    index,
    ftpId
) {
    const service =
        userServices[index];

    const input =
        document.getElementById(
            `ftpPassword-${ftpId}`
        );

    const password =
        input?.value || '';

    if (
        password.length < 8
    ) {
        showToast(
            'Hata',
            'Yeni şifre en az 8 karakter olmalı.'
        );

        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/ftp/${ftpId}/password`,
                {
                    method: 'PATCH',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            password
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Şifre değiştirilemedi.'
            );
        }

        if (input) {
            input.value = '';
        }

        showToast(
            'Başarılı',
            'FTP şifresi değiştirildi.'
        );

    } catch (error) {
        console.error(
            'FTP PASSWORD ERROR:',
            error
        );

        showToast(
            'FTP Hatası',
            error.message
        );
    }
}


// ======================================================
// FTP KOTASI DEĞİŞTİR
// ======================================================

async function changeFtpQuota(
    index,
    ftpId
) {
    const service =
        userServices[index];

    const quotaMb =
        Number(
            document
                .getElementById(
                    `ftpQuota-${ftpId}`
                )
                ?.value
        );

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/ftp/${ftpId}/quota`,
                {
                    method: 'PATCH',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            quota_mb:
                                quotaMb
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'FTP kotası değiştirilemedi.'
            );
        }

        await loadFtpFromBackend(
            index
        );

        showToast(
            'Başarılı',
            'FTP kotası güncellendi.'
        );

        window._serviceDetailTab =
            'dosyalar';

        openServiceDetail(index);

    } catch (error) {
        showToast(
            'FTP Hatası',
            error.message
        );
    }
}


// ======================================================
// FTP DİZİNİ DEĞİŞTİR
// ======================================================

// ======================================================
// FTP DİZİNİ DEĞİŞTİR
// ======================================================

async function changeFtpDirectory(
    index,
    ftpId
) {
    const service =
        userServices[index];

    if (
        !service ||
        !service.id ||
        service.type !== 'hosting'
    ) {
        showToast(
            'FTP Hatası',
            'Hosting hizmeti bulunamadı.'
        );

        return;
    }

    const directoryInput =
        document.getElementById(
            `ftpDirectory-${ftpId}`
        );

    const directory =
        directoryInput
            ?.value
            .trim();

    if (!directory) {
        showToast(
            'FTP Hatası',
            'FTP dizini boş bırakılamaz.'
        );

        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        showToast(
            'Oturum Hatası',
            'Lütfen tekrar giriş yapın.'
        );

        return;
    }

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/ftp/${ftpId}/directory`,
                {
                    method: 'PATCH',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            directory
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'FTP dizini değiştirilemedi.'
            );
        }

        await loadFtpFromBackend(
            index
        );

        showToast(
            'Başarılı',
            'FTP dizini güncellendi.'
        );

        window._serviceDetailTab =
            'dosyalar';

        openServiceDetail(
            index
        );

    } catch (error) {
        console.error(
            'FTP DIRECTORY ERROR:',
            error
        );

        showToast(
            'FTP Hatası',
            error.message
        );
    }
}

async function loadDnsFromBackend(index) {

    const service =
        userServices[index];

    if (
        !service ||
        service.type !== 'domain' ||
        !service.id
    ) {
        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/dns`,
                {
                    headers: {
                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'DNS kayıtları alınamadı.'
            );
        }

        service.dns =
            Array.isArray(data.records)
                ? data.records
                : [];

    } catch (error) {

        console.error(
            'DNS LOAD ERROR:',
            error
        );

        showToast(
            'DNS Hatası',
            error.message
        );
    }
}

async function loadServiceLogsFromBackend(index) {
    const service =
        userServices[index];

    if (
        !service ||
        !service.id
    ) {
        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        return;
    }

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/logs`,
                {
                    headers: {
                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'İşlem kayıtları alınamadı.'
            );
        }

        service.logs =
            Array.isArray(data.logs)
                ? data.logs.map(
                    log => ({
                        id: log.id,

                        action:
                            log.action,

                        date:
                            new Date(
                                String(
                                    log.created_at
                                ).replace(
                                    ' ',
                                    'T'
                                )
                            )
                            .toLocaleString(
                                'tr-TR'
                            )
                    })
                )
                : [];

    } catch (error) {
        console.error(
            'SERVICE LOG ERROR:',
            error
        );

        service.logs = [];

        showToast(
            'İşlem Kayıtları Hatası',
            error.message
        );
    }
}
async function setServiceDetailTab(
    tabId,
    index
) {
    const service =
        userServices[index];

    if (!service) {
        showToast(
            'Hata',
            'Hizmet bulunamadı.'
        );

        return;
    }

    window._serviceDetailTab =
        tabId;

    if (
        tabId === 'ns' &&
        service.type === 'domain'
    ) {
        await loadNameserversFromBackend(
            index
        );
    }

    if (
        tabId === 'dns' &&
        service.type === 'domain'
    ) {
        await loadDnsFromBackend(
            index
        );
    }

    if (
        tabId === 'dosyalar' &&
        service.type === 'hosting'
    ) {
        await loadFtpFromBackend(
            index
        );
    }

    if (
        tabId === 'veritabani' &&
        service.type === 'hosting'
    ) {
        await loadDatabasesFromBackend(
            index
        );
    }

    if (
        (
            tabId === 'webmail' ||
            tabId === 'kutular' ||
            tabId === 'kurulum'
        ) &&
        service.type === 'email'
    ) {
        await loadMailFromBackend(
            index
        );
    }

    if (tabId === 'loglar') {
        await loadServiceLogsFromBackend(
            index
        );
    }

    openServiceDetail(
        index
    );
}
 async function saveNameservers(index) {

    const service =
        userServices[index];

    if (
        !service ||
        !service.id ||
        service.type !== 'domain'
    ) {
        showToast(
            'Hata',
            'Domain hizmeti bulunamadı.'
        );

        return;
    }

    const ns1 =
        document
            .getElementById('ns1Input')
            ?.value
            .trim();

    const ns2 =
        document
            .getElementById('ns2Input')
            ?.value
            .trim();

    if (!ns1 || !ns2) {

        showToast(
            'Hata',
            'Her iki nameserver gerekli.'
        );

        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {

        showToast(
            'Oturum Hatası',
            'Lütfen tekrar giriş yapın.'
        );

        return;
    }

    try {

        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/nameservers`,
                {
                    method: 'PATCH',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            ns1,
                            ns2
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                'Nameserver güncellenemedi.'
            );
        }

        await loadNameserversFromBackend(
            index
        );

        showToast(
            'Kaydedildi',
            'Nameserver bilgileri güncellendi.'
        );

        window._serviceDetailTab =
            'ns';

        openServiceDetail(index);

    } catch (error) {

        console.error(
            'NAMESERVER SAVE ERROR:',
            error
        );

        showToast(
            'Nameserver Hatası',
            error.message
        );
    }
}

    function saveWhois(index) {
        userServices[index].responsible = {

            name:
                document
                    .getElementById(
                        'whoisName'
                    )
                    ?.value
                    .trim() ||
                '-',

            email:
                document
                    .getElementById(
                        'whoisEmail'
                    )
                    ?.value
                    .trim() ||
                '-',

            phone:
                document
                    .getElementById(
                        'whoisPhone'
                    )
                    ?.value
                    .trim() ||
                '-'
        };

        saveUserServices();

        showToast(
            'Kaydedildi',
            'Whois bilgileri güncellendi'
        );

        openServiceDetail(
            index
        );
    }

    function showAddDnsForm() {
        document
            .getElementById(
                'addDnsForm'
            )
            ?.classList.toggle(
                'hidden'
            );
    }
async function addDnsRecord(index) {

    const service =
        userServices[index];

    if (
        !service ||
        !service.id ||
        service.type !== 'domain'
    ) {
        showToast(
            'Hata',
            'Domain hizmeti bulunamadı.'
        );

        return;
    }

    const type =
        document
            .getElementById('dnsType')
            ?.value ||
        'A';

    const name =
        document
            .getElementById('dnsName')
            ?.value
            .trim() ||
        '@';

    const value =
        document
            .getElementById('dnsValue')
            ?.value
            .trim();

    if (!value) {

        showToast(
            'Hata',
            'DNS değeri zorunlu.'
        );

        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {

        showToast(
            'Oturum Hatası',
            'Lütfen tekrar giriş yapın.'
        );

        return;
    }

    try {

        const payload = {
            type,
            name,
            value,
            ttl: 3600
        };

        // Backend MX kaydında priority istiyor.
        if (type === 'MX') {
            payload.priority = 10;
        }

        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/dns`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(payload)
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                'DNS kaydı eklenemedi.'
            );
        }

        await loadDnsFromBackend(index);

        showToast(
            'Eklendi',
            'DNS kaydı eklendi.'
        );

        window._serviceDetailTab =
            'dns';

        openServiceDetail(index);

    } catch (error) {

        console.error(
            'DNS CREATE ERROR:',
            error
        );

        showToast(
            'DNS Hatası',
            error.message
        );
    }
}

let editingDnsServiceIndex = null;
let editingDnsRecordId = null;


function editDnsRecord(index, recordId) {

    const service =
        userServices[index];

    if (!service) {
        return;
    }

    const record =
        (service.dns || []).find(
            item =>
                Number(item.id) ===
                Number(recordId)
        );

    if (!record) {

        showToast(
            'Hata',
            'DNS kaydı bulunamadı.'
        );

        return;
    }

    editingDnsServiceIndex =
        index;

    editingDnsRecordId =
        Number(recordId);


    const form =
        document.getElementById(
            'editDnsForm'
        );

    const addForm =
        document.getElementById(
            'addDnsForm'
        );

    if (!form) {
        return;
    }


    // Kayıt ekleme formu açıksa kapat
    if (addForm) {
        addForm.classList.add(
            'hidden'
        );
    }


    document.getElementById(
        'editDnsType'
    ).value =
        record.type || 'A';


    document.getElementById(
        'editDnsName'
    ).value =
        record.name || '@';


    document.getElementById(
        'editDnsValue'
    ).value =
        record.value || '';


    document.getElementById(
        'editDnsTtl'
    ).value =
        record.ttl || 3600;


    document.getElementById(
        'editDnsPriority'
    ).value =
        record.priority ?? 10;


    toggleEditDnsPriority();

    form.classList.remove(
        'hidden'
    );


    form.scrollIntoView({
        behavior:
            'smooth',

        block:
            'nearest'
    });
}
function toggleEditDnsPriority() {

    const type =
        document.getElementById(
            'editDnsType'
        )?.value;

    const box =
        document.getElementById(
            'editDnsPriorityBox'
        );

    if (!box) {
        return;
    }

    if (type === 'MX') {

        box.classList.remove(
            'hidden'
        );

    } else {

        box.classList.add(
            'hidden'
        );
    }
}

    


function cancelEditDnsRecord() {

    const form =
        document.getElementById(
            'editDnsForm'
        );

    if (form) {

        form.classList.add(
            'hidden'
        );
    }

    editingDnsServiceIndex =
        null;

    editingDnsRecordId =
        null;
}


async function saveEditedDnsRecord() {

    if (
        editingDnsServiceIndex === null ||
        editingDnsRecordId === null
    ) {

        showToast(
            'Hata',
            'Düzenlenecek DNS kaydı bulunamadı.'
        );

        return;
    }


    const type =
        document
            .getElementById(
                'editDnsType'
            )
            ?.value;


    const name =
        document
            .getElementById(
                'editDnsName'
            )
            ?.value
            .trim() ||
        '@';


    const value =
        document
            .getElementById(
                'editDnsValue'
            )
            ?.value
            .trim();


    const ttl =
        Number(
            document
                .getElementById(
                    'editDnsTtl'
                )
                ?.value
        );


    const priority =
        Number(
            document
                .getElementById(
                    'editDnsPriority'
                )
                ?.value
        );


    if (!value) {

        showToast(
            'Hata',
            'DNS değeri boş bırakılamaz.'
        );

        return;
    }


    if (
        !Number.isInteger(ttl) ||
        ttl < 60 ||
        ttl > 86400
    ) {

        showToast(
            'Hata',
            'TTL 60 ile 86400 arasında olmalı.'
        );

        return;
    }


    if (
        type === 'MX' &&
        (
            !Number.isInteger(priority) ||
            priority < 0 ||
            priority > 65535
        )
    ) {

        showToast(
            'Hata',
            'MX önceliği 0 ile 65535 arasında olmalı.'
        );

        return;
    }


    const index =
        editingDnsServiceIndex;

    const recordId =
        editingDnsRecordId;


    await updateDnsRecord(
        index,
        recordId,
        {
            type,
            name,
            value,
            ttl,

            priority:
                type === 'MX'
                    ? priority
                    : null
        }
    );


    editingDnsServiceIndex =
        null;

    editingDnsRecordId =
        null;
}
// ======================================================
// SSL BİLGİLERİNİ BACKEND'DEN GETİR
// ======================================================

async function loadSslData(index) {
    const service = userServices[index];

    if (!service || !service.id) {
        showToast(
            'Hata',
            'SSL hizmeti bulunamadı.'
        );
        return null;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        showToast(
            'Oturum Hatası',
            'Lütfen tekrar giriş yapın.'
        );
        return null;
    }

    try {
        const response = await fetch(
            `https://anazhosting-backend.onrender.com/api/services/${service.id}/ssl`,
            {
                method: 'GET',

                headers: {
                    'Authorization':
                        `Bearer ${token}`
                }
            }
        );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const raw =
                await response.text();

            console.error(
                'SSL JSON DEĞİL:',
                response.status,
                raw
            );

            throw new Error(
                'Backend JSON yerine başka bir cevap döndürdü.'
            );
        }

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'SSL bilgileri alınamadı.'
            );
        }

        currentSslServiceIndex =
            index;

        currentSslData =
            data.ssl;

        return data.ssl;

    } catch (error) {
        console.error(
            'SSL LOAD ERROR:',
            error
        );

        showToast(
            'SSL Hatası',
            error.message
        );

        return null;
    }
}
// ======================================================
// SSL YÖNETİM EKRANI
// ======================================================

async function openSslManager(index) {
    const service = userServices[index];

    if (!service) {
        return;
    }

    if (service.type !== 'ssl') {
        showToast(
            'Hata',
            'Bu hizmet bir SSL hizmeti değil.'
        );
        return;
    }

    const ssl = await loadSslData(index);

    if (!ssl) {
        return;
    }

    const box = document.getElementById(
        'serviceDetailContent'
    );

    if (!box) {
        return;
    }

    const isActive =
        ssl.status === 'Aktif';

    const autoRenew =
        Number(ssl.auto_renew) === 1;

    const statusClass =
        isActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200';

    box.innerHTML = `
        <div class="space-y-6">

            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>
                    <div class="flex items-center gap-3">

                        <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <i class="fa-solid fa-shield-halved text-emerald-500 text-xl"></i>
                        </div>

                        <div>
                            <h2 class="text-xl font-bold text-slate-900">
                                ${service.name}
                            </h2>

                            <p class="text-sm text-slate-500">
                                SSL Sertifika Yönetimi
                            </p>
                        </div>

                    </div>
                </div>

                <span class="inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-semibold ${statusClass}">
                    ${ssl.status || 'Bekliyor'}
                </span>

            </div>


            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                <div class="bg-white border border-slate-200 rounded-2xl p-5">

                    <div class="text-xs font-semibold text-slate-400 uppercase">
                        Domain
                    </div>

                    <div class="mt-2 font-semibold text-slate-900 break-all">
                        ${ssl.domain || 'Domain bağlanmadı'}
                    </div>

                </div>


                <div class="bg-white border border-slate-200 rounded-2xl p-5">

                    <div class="text-xs font-semibold text-slate-400 uppercase">
                        Durum
                    </div>

                    <div class="mt-2 font-semibold ${
                        isActive
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                    }">
                        ${ssl.status || 'Bekliyor'}
                    </div>

                </div>


                <div class="bg-white border border-slate-200 rounded-2xl p-5">

                    <div class="text-xs font-semibold text-slate-400 uppercase">
                        Başlangıç
                    </div>

                    <div class="mt-2 font-semibold text-slate-900">
                        ${formatDate(ssl.issued_at)}
                    </div>

                </div>


                <div class="bg-white border border-slate-200 rounded-2xl p-5">

                    <div class="text-xs font-semibold text-slate-400 uppercase">
                        Bitiş
                    </div>

                    <div class="mt-2 font-semibold text-slate-900">
                        ${formatDate(ssl.expires_at)}
                    </div>

                </div>

            </div>


            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <!-- DOMAIN AYARI -->

                <div class="bg-white border border-slate-200 rounded-2xl p-6">

                    <div class="flex items-center gap-3 mb-5">

                        <div class="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                            <i class="fa-solid fa-globe text-sky-500"></i>
                        </div>

                        <div>
                            <h3 class="font-bold text-slate-900">
                                SSL Domaini
                            </h3>

                            <p class="text-xs text-slate-500">
                                Sertifikanın kullanılacağı domain
                            </p>
                        </div>

                    </div>


                    <label class="block text-xs font-semibold text-slate-600 mb-2">
                        Domain
                    </label>

                    <input
                        id="sslDomainInput"
                        type="text"
                        value="${ssl.domain || ''}"
                        placeholder="ornek.com"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-sky-400 transition"
                    >


                    <button
                        onclick="saveSslDomain(${index})"
                        class="mt-4 w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold px-5 py-3 rounded-xl transition"
                    >
                        <i class="fa-solid fa-floppy-disk mr-2"></i>
                        Domaini Kaydet
                    </button>

                </div>


                <!-- SERTİFİKA -->

                <div class="bg-white border border-slate-200 rounded-2xl p-6">

                    <div class="flex items-center gap-3 mb-5">

                        <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <i class="fa-solid fa-lock text-emerald-500"></i>
                        </div>

                        <div>
                            <h3 class="font-bold text-slate-900">
                                Sertifika
                            </h3>

                            <p class="text-xs text-slate-500">
                                SSL sertifika durumu
                            </p>
                        </div>

                    </div>


                    <div class="space-y-3 text-sm">

                        <div class="flex justify-between gap-4">
                            <span class="text-slate-500">
                                Sağlayıcı
                            </span>

                            <span class="font-semibold text-slate-900">
                                        ${ssl.provider || 'ANAZHOSTING SSL'}
                            </span>
                        </div>


                        <div class="flex justify-between gap-4">
                            <span class="text-slate-500">
                                Durum
                            </span>

                            <span class="font-semibold ${
                                isActive
                                    ? 'text-emerald-600'
                                    : 'text-amber-600'
                            }">
                                ${ssl.status || 'Bekliyor'}
                            </span>
                        </div>


                        <div class="flex justify-between gap-4">
                            <span class="text-slate-500">
                                Otomatik Yenileme
                            </span>

                            <span class="font-semibold ${
                                autoRenew
                                    ? 'text-emerald-600'
                                    : 'text-slate-500'
                            }">
                                ${autoRenew ? 'Açık' : 'Kapalı'}
                            </span>
                        </div>

                    </div>


                    ${
                        !isActive
                            ? `
                                <button
                                    onclick="activateSsl(${index})"
                                    class="mt-5 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-3 rounded-xl transition"
                                >
                                    <i class="fa-solid fa-shield-halved mr-2"></i>
                                    SSL Aktif Et
                                </button>
                            `
                            : `
                                <div class="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm">
                                    <i class="fa-solid fa-circle-check mr-2"></i>
                                    SSL sertifikası aktif.
                                </div>
                            `
                    }

                </div>

            </div>


            <!-- OTOMATİK YENİLEME -->

            <div class="bg-white border border-slate-200 rounded-2xl p-6">

                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    <div>

                        <h3 class="font-bold text-slate-900">
                            Otomatik Yenileme
                        </h3>

                        <p class="text-sm text-slate-500 mt-1">
                            SSL sertifikasının otomatik yenileme ayarını yönetin.
                        </p>

                    </div>


                    <button
                        onclick="toggleSslAutoRenew(${index}, ${autoRenew ? 'false' : 'true'})"
                        class="${
                            autoRenew
                                ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                        } px-5 py-3 rounded-xl text-sm font-semibold transition"
                    >

                        ${
                            autoRenew
                                ? 'Otomatik Yenilemeyi Kapat'
                                : 'Otomatik Yenilemeyi Aç'
                        }

                    </button>

                </div>

            </div>

        </div>
    `;

    showDashboardSection(
        'service-detail'
    );
}
// ======================================================
// SSL DOMAIN KAYDET
// ======================================================

async function saveSslDomain(index) {
    const service = userServices[index];

    if (!service || !service.id) {
        return;
    }

    const input =
        document.getElementById(
            'sslDomainInput'
        );

    const domain =
        String(input?.value || '')
            .trim()
            .toLowerCase();

    if (!domain) {
        showToast(
            'Eksik Bilgi',
            'Domain adresini girin.'
        );

        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    try {
const response = await fetch(
    `https://anazhosting-backend.onrender.com/api/services/${service.id}/ssl`,
    {
        method: 'PATCH',

        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },

        body: JSON.stringify({
            domain: domain
        })
    }
);

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Domain kaydedilemedi.'
            );
        }

        currentSslData =
            data.ssl;

        showToast(
            'SSL Güncellendi',
            'Domain başarıyla kaydedildi.'
        );

        await openSslManager(index);

    } catch (error) {
        console.error(
            'SSL DOMAIN ERROR:',
            error
        );

        showToast(
            'Hata',
            error.message
        );
    }
}
// ======================================================
// SSL AKTİF ET
// ======================================================

async function activateSsl(index) {
    const service = userServices[index];

    if (!service || !service.id) {
        showToast(
            'Hata',
            'SSL hizmeti bulunamadı.'
        );
        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        showToast(
            'Oturum Hatası',
            'Lütfen tekrar giriş yapın.'
        );
        return;
    }

    const input =
        document.getElementById(
            'sslDomainInput'
        );

    const domain =
        String(input?.value || '')
            .trim()
            .toLowerCase();

    if (!domain) {
        showToast(
            'Domain Gerekli',
            'Önce SSL için bir domain girin.'
        );
        return;
    }

    try {

        // ==============================================
        // 1. ÖNCE DOMAINİ KAYDET
        // ==============================================

        const saveResponse =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/ssl`,
                {
                    method: 'PATCH',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            domain: domain
                        })
                }
            );

        const saveData =
            await saveResponse.json();

        if (!saveResponse.ok) {
            throw new Error(
                saveData.message ||
                'Domain kaydedilemedi.'
            );
        }

        currentSslData =
            saveData.ssl;


        // ==============================================
        // 2. SONRA SSL AKTİF ET
        // ==============================================

        const activateResponse =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/ssl/activate`,
                {
                    method: 'POST',

                    headers: {
                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );

        const activateData =
            await activateResponse.json();

        if (!activateResponse.ok) {
            throw new Error(
                activateData.message ||
                'SSL aktif edilemedi.'
            );
        }

        currentSslData =
            activateData.ssl;

        showToast(
            'SSL Aktif',
            `${activateData.ssl.domain} için SSL aktif edildi.`
        );

        await openSslManager(index);

    } catch (error) {

        console.error(
            'SSL ACTIVATE ERROR:',
            error
        );

        showToast(
            'SSL Hatası',
            error.message
        );
    }
}
// ======================================================
// SSL OTOMATİK YENİLEME
// ======================================================

async function toggleSslAutoRenew(
    index,
    enabled
) {
    const service =
        userServices[index];

    if (!service || !service.id) {
        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    try {
   const response = await fetch(
    `https://anazhosting-backend.onrender.com/api/services/${service.id}/ssl/auto-renew`,
    {
        method: 'PATCH',

                headers: {
                    'Content-Type':
                        'application/json',

                    'Authorization':
                        `Bearer ${token}`
                },

                body: JSON.stringify({
                    enabled:
                        Boolean(enabled)
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Otomatik yenileme değiştirilemedi.'
            );
        }

        showToast(
            'SSL Güncellendi',
            data.message
        );

        await openSslManager(index);

    } catch (error) {
        console.error(
            'SSL AUTO RENEW ERROR:',
            error
        );

        showToast(
            'Hata',
            error.message
        );
    }
}


async function updateDnsRecord(
    index,
    recordId,
    changes
) {

    const service =
        userServices[index];

    if (
        !service ||
        !service.id ||
        !recordId
    ) {

        showToast(
            'Hata',
            'DNS kaydı bulunamadı.'
        );

        return;
    }

    if (!changes.value) {

        showToast(
            'Hata',
            'DNS değeri boş bırakılamaz.'
        );

        return;
    }

    if (
        !Number.isInteger(changes.ttl) ||
        changes.ttl < 60 ||
        changes.ttl > 86400
    ) {

        showToast(
            'Hata',
            'TTL 60 ile 86400 arasında olmalı.'
        );

        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {

        showToast(
            'Oturum Hatası',
            'Lütfen tekrar giriş yapın.'
        );

        return;
    }

    try {

        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/dns/${recordId}`,
                {
                    method: 'PATCH',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(
                            changes
                        )
                }
            );

        let data = {};

        try {
            data =
                await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                'DNS kaydı güncellenemedi.'
            );
        }

        await loadDnsFromBackend(
            index
        );

        window._serviceDetailTab =
            'dns';

        openServiceDetail(index);

        showToast(
            'Güncellendi',
            'DNS kaydı başarıyla güncellendi.'
        );

    } catch (error) {

        console.error(
            'DNS UPDATE ERROR:',
            error
        );

        showToast(
            'DNS Hatası',
            error.message
        );
    }
}

async function removeDnsRecord(
    index,
    recordId
) {

    const service =
        userServices[index];

    if (
        !service ||
        !service.id ||
        !recordId
    ) {
        showToast(
            'Hata',
            'DNS kaydı bulunamadı.'
        );

        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/dns/${recordId}`,
                {
                    method: 'DELETE',

                    headers: {
                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                'DNS kaydı silinemedi.'
            );
        }

        await loadDnsFromBackend(index);

        showToast(
            'Silindi',
            'DNS kaydı kaldırıldı.'
        );

        window._serviceDetailTab =
            'dns';

        openServiceDetail(index);

    } catch (error) {

        console.error(
            'DNS DELETE ERROR:',
            error
        );

        showToast(
            'DNS Hatası',
            error.message
        );
    }
}

    function saveRedirect(index) {
        const url =
            document
                .getElementById(
                    'redirectInput'
                )
                ?.value
                .trim() ||
            '';

        userServices[index].redirectUrl =
            url;

        saveUserServices();

        showToast(
            'Kaydedildi',
            url
                ? 'Yönlendirme kaydedildi'
                : 'Yönlendirme kaldırıldı'
        );

        window._serviceDetailTab =
            'yonlendirme';

        openServiceDetail(
            index
        );
    }

    function showAddMailboxForm() {
        document
            .getElementById(
                'addMailboxForm'
            )
            ?.classList.toggle(
                'hidden'
            );
    }

async function loadMailFromBackend(index) {
    const service = userServices[index];

    if (
        !service ||
        !service.id ||
        service.type !== 'email'
    ) {
        return;
    }

    const token =
        localStorage.getItem('vortex_token');

    if (!token) {
        return;
    }

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/mail`,
                {
                    headers: {
                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Mail bilgileri alınamadı.'
            );
        }

        service.mailDomain =
            data.mail?.domain || '';

        service.webmailUrl =
            data.mail?.webmail_url ||
            'https://webmail.anazhosting.com.tr ';

        service.mailboxes =
            Array.isArray(data.mailboxes)
                ? data.mailboxes
                : [];

    } catch (error) {
        console.error(
            'MAIL LOAD ERROR:',
            error
        );

        showToast(
            'Mail Hatası',
            error.message
        );
    }
}


async function saveMailDomain(index) {
    const service =
        userServices[index];

    if (!service || !service.id) {
        showToast(
            'Hata',
            'Mail hizmeti bulunamadı.'
        );

        return;
    }

    const domain =
        document
            .getElementById(
                'mailDomainInput'
            )
            ?.value
            .trim();

    if (!domain) {
        showToast(
            'Hata',
            'Domain adı gerekli.'
        );

        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        showToast(
            'Oturum Hatası',
            'Lütfen tekrar giriş yapın.'
        );

        return;
    }

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/mail/domain`,
                {
                    method: 'PATCH',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            domain
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Mail domaini kaydedilemedi.'
            );
        }

        service.mailDomain =
            data.mail?.domain || domain;

        service.webmailUrl =
            data.mail?.webmail_url ||
            service.webmailUrl;

        await loadMailFromBackend(index);

        showToast(
            'Kaydedildi',
            'Mail domaini başarıyla güncellendi.'
        );

        window._serviceDetailTab =
            'kutular';

        openServiceDetail(index);

    } catch (error) {
        console.error(
            'MAIL DOMAIN SAVE ERROR:',
            error
        );

        showToast(
            'Mail Hatası',
            error.message
        );
    }
}


async function addMailbox(index) {
    const service =
        userServices[index];

    if (!service || !service.id) {
        showToast(
            'Hata',
            'Mail hizmeti bulunamadı.'
        );

        return;
    }

    const username =
        document
            .getElementById(
                'mbLocal'
            )
            ?.value
            .trim();

    const password =
        document
            .getElementById(
                'mbPass'
            )
            ?.value;

    const quotaMb =
        Number(
            document
                .getElementById(
                    'mbQuota'
                )
                ?.value || 1024
        );

    if (!service.mailDomain) {
        showToast(
            'Hata',
            'Önce mail domainini kaydedin.'
        );

        return;
    }

    if (!username || !password) {
        showToast(
            'Hata',
            'Kullanıcı adı ve şifre gerekli.'
        );

        return;
    }

    if (password.length < 8) {
        showToast(
            'Hata',
            'Şifre en az 8 karakter olmalı.'
        );

        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        showToast(
            'Oturum Hatası',
            'Lütfen tekrar giriş yapın.'
        );

        return;
    }

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/mailboxes`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            username,
                            password,
                            quota_mb:
                                quotaMb
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Mail hesabı oluşturulamadı.'
            );
        }

        await loadMailFromBackend(index);

        showToast(
            'Mail Oluşturuldu',
            `${data.mailbox.email} oluşturuldu.`
        );

        window._serviceDetailTab =
            'kutular';

        openServiceDetail(index);

    } catch (error) {
        console.error(
            'MAILBOX CREATE ERROR:',
            error
        );

        showToast(
            'Mail Hatası',
            error.message
        );
    }
}


async function removeMailbox(
    index,
    mailboxId
) {
    const service =
        userServices[index];

    if (
        !service ||
        !service.id ||
        !mailboxId
    ) {
        return;
    }

    const token =
        localStorage.getItem(
            'vortex_token'
        );

    if (!token) {
        showToast(
            'Oturum Hatası',
            'Lütfen tekrar giriş yapın.'
        );

        return;
    }

    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/services/${service.id}/mailboxes/${mailboxId}`,
                {
                    method: 'DELETE',

                    headers: {
                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Mail hesabı silinemedi.'
            );
        }

        await loadMailFromBackend(index);

        showToast(
            'Silindi',
            'Mail hesabı kaldırıldı.'
        );

        window._serviceDetailTab =
            'kutular';

        openServiceDetail(index);

    } catch (error) {
        console.error(
            'MAILBOX DELETE ERROR:',
            error
        );

        showToast(
            'Mail Hatası',
            error.message
        );
    }
}

    function saveSslDomain(index) {
        const domain =
            document
                .getElementById(
                    'sslDomainInput'
                )
                ?.value
                .trim() ||
            '';

        if (!domain) {

            showToast(
                'Hata',
                'Domain gerekli'
            );

            return;
        }

        userServices[index].sslDomain =
            domain;

        userServices[index].sslStatus =
            'Kurulum kuyruğunda';

        saveUserServices();

        showToast(
            'Kaydedildi',
            'SSL domaini güncellendi'
        );

        window._serviceDetailTab =
            'sertifika';

        openServiceDetail(
            index
        );
    }

    function addDatabase(index) {
        const base =
            (
                userServices[index].panelUser ||
                'user'
            )
                .toString()
                .split('@')[0]
                .replace(
                    /[^a-z0-9]/gi,
                    ''
                )
                .slice(
                    0,
                    8
                ) ||
            'user';

        const count =
            (
                userServices[index]
                    .databases ||
                []
            ).length + 1;

        const name =
            base +
            '_db' +
            count;

        const user =
            base +
            '_u' +
            count;

        userServices[index].databases =
            userServices[index].databases ||
            [];

        userServices[index].databases.push({
            name,
            user
        });

        saveUserServices();

        showToast(
            'Oluşturuldu',
            name +
            ' eklendi'
        );

        window._serviceDetailTab =
            'veritabani';

        openServiceDetail(
            index
        );
    }

    function removeDatabase(
        index,
        databaseIndex
    ) {

        userServices[index]
            .databases
            .splice(
                databaseIndex,
                1
            );

        saveUserServices();

        showToast(
            'Silindi',
            'Veritabanı kaldırıldı'
        );

        window._serviceDetailTab =
            'veritabani';

        openServiceDetail(
            index
        );
    }

    function toggleTransferLock(index) {
        userServices[index].transferLock =
            !userServices[index].transferLock;

        saveUserServices();

        openServiceDetail(
            index
        );
    }

    function renderServices() {
        const box =
            document.getElementById(
                'servicesContent'
            );

        if (!box) {
            return;
        }

        if (
            !Array.isArray(userServices) ||
            userServices.length === 0
        ) {
            box.innerHTML = `
                <div class="text-center py-16">

                    <div class="w-20 h-20 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-5">

                        <i class="fa-solid fa-server text-3xl text-slate-300"></i>

                    </div>

                    <h4 class="text-lg font-semibold text-slate-800 mb-2">
                        Henüz hizmetiniz yok
                    </h4>

                    <p class="text-slate-500 mb-6">
                        Hosting, VDS, SSL veya Mail satın alarak başlayın
                    </p>

                    <button
                        onclick="showHomeView(); document.getElementById('plans').scrollIntoView({behavior:'smooth'})"
                        class="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-xl text-sm"
                    >
                        Paketleri İncele
                    </button>

                </div>
            `;

            return;
        }

        box.innerHTML =
            '<div class="space-y-4">' +

            userServices.map(
                (service, index) => {

                    const days =
                        getDaysLeft(
                            service.expiryDate
                        );

                    const isCancelled =
                        service.status ===
                        'İptal Edildi';

                    const isExpired =
                        service.status ===
                        'Süresi Doldu';

                    const isActive =
                        service.status ===
                        'Aktif';

                    let statusClass =
                        'bg-emerald-50 text-emerald-600';

                    let statusDot =
                        'bg-emerald-500';

                    if (isExpired) {
                        statusClass =
                            'bg-amber-50 text-amber-600';

                        statusDot =
                            'bg-amber-500';
                    }

                    if (isCancelled) {
                        statusClass =
                            'bg-red-50 text-red-600';

                        statusDot =
                            'bg-red-500';
                    }

                    const icon =
                        service.type === 'domain'
                            ? 'fa-globe'
                            : service.type === 'vds'
                                ? 'fa-microchip'
                                : service.type === 'ssl'
                                    ? 'fa-lock'
                                    : service.type === 'email'
                                        ? 'fa-envelope'
                                        : 'fa-server';

                    const typeLabel =
                        service.type === 'domain'
                            ? 'Domain'
                            : service.type === 'vds'
                                ? 'VDS'
                                : service.type === 'ssl'
                                    ? 'SSL'
                                    : service.type === 'email'
                                        ? 'Kurumsal Mail'
                                        : 'Hosting';

                    return `
                        <div
                            class="border ${
                                isCancelled
                                    ? 'border-red-100 bg-red-50/20'
                                    : 'border-slate-200 bg-white'
                            } rounded-2xl p-5 hover:shadow-md transition"
                        >

                            <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-5">

                                <div
                                    class="flex items-center gap-4 min-w-0 cursor-pointer"
                                    onclick="openServiceDetail(${index})"
                                >

                                    <div class="w-12 h-12 flex-shrink-0 rounded-xl ${
                                        isCancelled
                                            ? 'bg-red-50'
                                            : 'bg-sky-50'
                                    } flex items-center justify-center">

                                        <i class="fa-solid ${icon} ${
                                            isCancelled
                                                ? 'text-red-400'
                                                : 'text-sky-500'
                                        }"></i>

                                    </div>

                                    <div class="min-w-0">

                                        <div class="font-semibold text-slate-900 truncate">
                                            ${service.name}
                                        </div>

                                        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 mt-1">

                                            <span>
                                                ${typeLabel}
                                            </span>

                                            <span>
                                                •
                                            </span>

                                            <span>
                                                ₺${Number(service.price || 0).toFixed(2)}
                                                /
                                                ${service.period || '-'}
                                            </span>

                                            ${
                                                !isCancelled
                                                    ? `
                                                        <span>
                                                            •
                                                        </span>

                                                        <span>
                                                            ${
                                                                isExpired
                                                                    ? 'Süresi doldu'
                                                                    : `${days} gün kaldı`
                                                            }
                                                        </span>
                                                    `
                                                    : ''
                                            }

                                        </div>

                                        <div class="text-xs text-slate-400 mt-1">
                                            Bitiş:
                                            ${formatDate(service.expiryDate)}
                                        </div>

                                    </div>

                                </div>


                                <div class="flex flex-wrap items-center gap-2">

                                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusClass}">

                                        <span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span>

                                        ${service.status}

                                    </span>


                                            ${service.status !== 'İptal Edildi' ? `
                                <button 
                                    type="button" 
                                    onclick="openServiceDetail(${index})" 
                                    class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600 text-xs font-semibold transition"
                                > 
                                    <i class="fa-solid fa-eye mr-1"></i> 
                                    Detay
                                </button>
                            ` : ''}


                                    ${
                                        !isCancelled
                                            ? `
                                                <button
                                                    type="button"
                                                    onclick="renewService(${index})"
                                                    class="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold transition"
                                                >
                                                    <i class="fa-solid fa-rotate mr-1"></i>
                                                    Yenile
                                                </button>

                                                <button
                                                    type="button"
                                                    onclick="cancelService(${index})"
                                                    class="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition"
                                                >
                                                    <i class="fa-solid fa-ban mr-1"></i>
                                                    İptal Et
                                                </button>
                                            `
                                            : `
                                                <span class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold">
                                                    <i class="fa-solid fa-ban mr-1"></i>
                                                    Hizmet İptal Edildi
                                                </span>
                                            `
                                    }

                                </div>

                            </div>

                        </div>
                    `;
                }
            ).join('') +

            '</div>';
    }


    // ======================================================
    // ANA SAYFA / DOMAIN
    // ======================================================

    function showHomeView() {
        const dash =
            document.getElementById(
                'userDashboard'
            );

        const app =
            document.getElementById(
                'appContainer'
            );

        const domainResult =
            document.getElementById(
                'domainResult'
            );

        const plansPage =
            document.getElementById(
                'servicePlansPage'
            );

        if (dash) {
            dash.classList.add(
                'hidden'
            );
        }

        if (app) {
            app.style.display =
                'block';
        }

        if (domainResult) {
            domainResult.classList.add(
                'hidden'
            );
        }

        if (plansPage) {
            plansPage.classList.add(
                'hidden'
            );
        }

        currentServiceCategory =
            null;

        window.scrollTo({
            top:
                0,

            behavior:
                'smooth'
        });
    }

    function focusDomainSearch() {
        showHomeView();

        setTimeout(
            () => {

                const domainInput =
                    document.getElementById(
                        'domainInput'
                    );

                if (domainInput) {

                    domainInput.focus();

                    domainInput.scrollIntoView({
                        behavior:
                            'smooth',

                        block:
                            'center'
                    });
                }
            },
            150
        );
    }

 async function checkDomain() {
    const inputEl =
        document.getElementById(
            'domainInput'
        );


    if (!inputEl) {
        return;
    }


    const input =
        inputEl.value
            .trim()
            .toLowerCase();


    if (!input) {
        showToast(
            'Domain',
            'Lütfen bir domain adı girin.'
        );

        return;
    }


    const resultsList =
        document.getElementById(
            'domainResultsList'
        );


    const domainResult =
        document.getElementById(
            'domainResult'
        );


    if (domainResult) {
        domainResult.classList.remove(
            'hidden'
        );
    }


    if (resultsList) {
        resultsList.innerHTML = `
            <div class="py-10 text-center">

                <i class="fa-solid fa-spinner fa-spin text-sky-500 text-2xl"></i>

                <p class="text-sm text-slate-500 mt-3">
                    Domain sorgulanıyor...
                </p>

            </div>
        `;
    }


    try {
        const response =
            await fetch(
                `https://anazhosting-backend.onrender.com/api/domains/search?q=${encodeURIComponent(input)}`
            );


        let data = {};


        try {
            data =
                await response.json();

        } catch {
            data = {};
        }


        if (!response.ok) {
            if (resultsList) {
                resultsList.innerHTML = `
                    <div class="py-8 text-center text-sm text-red-500">
                        ${
                            data.message ||
                            'Domain sorgulanamadı.'
                        }
                    </div>
                `;
            }

            return;
        }


        const results =
            Array.isArray(
                data.results
            )
                ? data.results
                : [];


        if (
            results.length === 0
        ) {
            if (resultsList) {
                resultsList.innerHTML = `
                    <div class="py-8 text-center text-sm text-slate-500">
                        Sonuç bulunamadı.
                    </div>
                `;
            }

            return;
        }


        if (resultsList) {
            resultsList.innerHTML = `

                ${
                    data.live === false
                        ? `
                            <div class="px-5 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">

                                <i class="fa-solid fa-circle-info mr-1"></i>

                                Geliştirme modu:
                                Gerçek domain firması API'si henüz bağlı değil.
                           Müsaitlik şu anda ANAZHOSTING veritabanına göre kontrol ediliyor.

                            </div>
                        `
                        : ''
                }

                ${results.map(
                    item => {

                        const available =
                            item.available ===
                            true;


                        return `
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 hover:bg-slate-50">

                                <div class="flex items-center gap-3">

                                    <div class="w-9 h-9 rounded-lg ${
                                        available
                                            ? 'bg-emerald-50'
                                            : 'bg-red-50'
                                    } flex items-center justify-center">

                                        <i class="fa-solid fa-globe ${
                                            available
                                                ? 'text-emerald-500'
                                                : 'text-red-400'
                                        } text-sm"></i>

                                    </div>


                                    <div>

                                        <div class="font-semibold text-sm text-slate-900">
                                            ${item.domain}
                                        </div>

                                        <div class="text-xs mt-1 ${
                                            available
                                                ? 'text-emerald-600'
                                                : 'text-red-500'
                                        }">

                                            ${
                                                available
                                                    ? 'ANAZHOSTING sisteminde müsait'
                                                    : 'ANAZHOSTING sisteminde kayıtlı'
                                            }

                                        </div>

                                    </div>

                                </div>


                                <div class="flex items-center justify-between sm:justify-end gap-4">

                                    <div class="text-right">

                                        <div class="font-bold text-slate-900">
                                            ₺${Number(item.price || 0).toFixed(2)}
                                        </div>

                                        <div class="text-xs text-slate-500">
                                            /yıl
                                        </div>

                                    </div>


                                    ${
                                        available
                                            ? `
                                                <button
                                                    onclick="addToCart('${item.domain}', ${Number(item.price || 0)}, 'yıl')"
                                                    class="bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                                                >
                                                    Sepete Ekle
                                                </button>
                                            `
                                            : `
                                                <button
                                                    disabled
                                                    class="bg-slate-100 text-slate-400 text-xs font-semibold px-4 py-2 rounded-lg cursor-not-allowed"
                                                >
                                                    Kayıtlı
                                                </button>
                                            `
                                    }

                                </div>

                            </div>
                        `;
                    }
                ).join('')}
            `;
        }


        if (domainResult) {
            domainResult.scrollIntoView({
                behavior:
                    'smooth',

                block:
                    'start'
            });
        }


    } catch (error) {
        console.error(
            'DOMAIN SEARCH ERROR:',
            error
        );


        if (resultsList) {
            resultsList.innerHTML = `
                <div class="py-8 text-center">

                    <p class="text-sm font-semibold text-red-500">
                        Backend sunucusuna bağlanılamadı.
                    </p>

                    <p class="text-xs text-slate-500 mt-1">
                        Node sunucusunun açık olduğundan emin olun.
                    </p>

                </div>
            `;
        }
    }
}


    // ======================================================
    // DASHBOARD
    // ======================================================

    async function showDashboardSection(sec) {
        document
            .querySelectorAll(
                '.dashboard-section'
            )
            .forEach(
                el =>
                    el.classList.add(
                        'hidden'
                    )
            );

        document
            .querySelectorAll(
                '.dashboard-nav'
            )
            .forEach(
                el =>
                    el.classList.remove(
                        'active'
                    )
            );

        const target =
            document.getElementById(
                'section-' + sec
            );

        if (target) {
            target.classList.remove(
                'hidden'
            );
        }

        if (
            sec !== 'service-detail'
        ) {

            const nav =
                document.getElementById(
                    'nav-' + sec
                );

            if (nav) {
                nav.classList.add(
                    'active'
                );
            }
        }

        if (
            sec === 'services'
        ) {
            renderServices();
        }

        if (
            sec === 'billing'
        ) {

            await loadInvoices();

            renderInvoices();
            updateStats();
        }
    }

    function updateAuthUI() {
        const authArea =
            document.getElementById(
                'dynamicAuthArea'
            );

        if (!authArea) {
            return;
        }

        if (currentUser) {

            const displayName =
                currentUser.name ||
                currentUser.email ||
                'Müşteri';

            authArea.innerHTML = `
                <button
                    onclick="openDashboard()"
                    class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium hover:border-sky-300 transition"
                >
                    <i class="fa-solid fa-user text-sky-500"></i>
                    ${displayName}
                </button>
            `;

            openDashboard();

        } else {

            authArea.innerHTML = `
                <button
                    onclick="openLoginModal()"
                    class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold transition"
                >
                    Giriş Yap
                </button>

                <button
                    onclick="openRegisterModal()"
                    class="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold shadow-md shadow-sky-500/20 transition"
                >
                    Kayıt Ol
                </button>
            `;

            const dash =
                document.getElementById(
                    'userDashboard'
                );

            const app =
                document.getElementById(
                    'appContainer'
                );

            if (dash) {
                dash.classList.add(
                    'hidden'
                );
            }

            if (app) {
                app.style.display =
                    'block';
            }
        }
    }

    async function openDashboard() {
        const app =
            document.getElementById(
                'appContainer'
            );

        const dashboard =
            document.getElementById(
                'userDashboard'
            );

        if (app) {
            app.style.display =
                'none';
        }

        if (dashboard) {
            dashboard.classList.remove(
                'hidden'
            );
        }

        const displayName =
            currentUser.name ||
            currentUser.email;

        const userEmailEl =
            document.getElementById(
                'dashboardUserEmail'
            );

        if (userEmailEl) {
            userEmailEl.textContent =
                displayName;
        }

        const accName =
            document.getElementById(
                'accountName'
            );

        if (accName) {
            accName.value =
                currentUser.name ||
                '';
        }

        const accEmail =
            document.getElementById(
                'accountEmail'
            );

        if (accEmail) {
            accEmail.value =
                currentUser.email ||
                '';
        }

        await loadUserServices();
        await loadInvoices();

        renderServices();
        renderInvoices();
        updateStats();

        await showDashboardSection(
            'overview'
        );
    }

    function logoutUser() {
        currentUser = null;
        userServices = [];
        userInvoices = [];

        localStorage.removeItem(
            'vortex_logged_user'
        );

        localStorage.removeItem(
            'vortex_token'
        );

        updateAuthUI();
        showHomeView();
    }

    function updateStats() {
        const statServices =
            document.getElementById(
                'stat-services'
            );

        if (statServices) {

            statServices.textContent =
                userServices.filter(
                    service =>
                        service.status ===
                        'Aktif'
                ).length;
        }

        const statInvoices =
            document.getElementById(
                'stat-invoices'
            );

        if (statInvoices) {
            statInvoices.textContent =
                userInvoices.length;
        }

        renderDashboardServiceCards();
    }

    function renderDashboardServiceCards() {
        const grid =
            document.getElementById(
                'dashboardServicesGrid'
            );

        if (!grid) {
            return;
        }

        const activeDomains =
            userServices.filter(
                service =>
                    service.type ===
                    'domain' &&
                    service.status ===
                    'Aktif'
            ).length;

        const cards = [
            {
                icon:
                    'fa-globe',

                iconBg:
                    'bg-violet-100 text-violet-600',

                title:
                    t('activeDomains'),

                desc:
                    activeDomains > 0
                        ? `${activeDomains} ${t('activeDomainsCount')}`
                        : t('activeDomainsDesc'),

                badge:
                    activeDomains > 0
                        ? String(activeDomains)
                        : null,

                badgeColor:
                    'bg-violet-500',

                btnText:
                    activeDomains > 0
                        ? t('btnManage')
                        : t('btnQuery'),

                btnClass:
                    'border border-slate-200 text-slate-700 hover:bg-slate-50',

                action:
                    activeDomains > 0
                        ? "showDashboardSection('services')"
                        : "openServiceCategory('domain')"
            },

            {
                icon:
                    'fa-server',

                iconBg:
                    'bg-sky-100 text-sky-600',

                title:
                    t('catHosting'),

                desc:
                    t('catHostingDesc'),

                badge:
                    null,

                btnText:
                    t('btnBuy'),

                btnClass:
                    'bg-sky-500 text-white hover:bg-sky-600',

                action:
                    "openServiceCategory('hosting')"
            },

            {
                icon:
                    'fa-microchip',

                iconBg:
                    'bg-indigo-100 text-indigo-600',

                title:
                    t('catVds'),

                desc:
                    t('catVdsDesc'),

                badge:
                    null,

                btnText:
                    t('btnBuy'),

                btnClass:
                    'bg-indigo-500 text-white hover:bg-indigo-600',

                action:
                    "openServiceCategory('vds')"
            },

            {
                icon:
                    'fa-lock',

                iconBg:
                    'bg-emerald-100 text-emerald-600',

                title:
                    t('catSsl'),

                desc:
                    t('catSslDesc'),

                badge:
                    null,

                btnText:
                    t('btnBuy'),

                btnClass:
                    'bg-emerald-500 text-white hover:bg-emerald-600',

                action:
                    "openServiceCategory('ssl')"
            },

            {
                icon:
                    'fa-envelope',

                iconBg:
                    'bg-amber-100 text-amber-600',

                title:
                    t('catEmail'),

                desc:
                    t('catEmailDesc'),

                badge:
                    null,

                btnText:
                    t('btnBuy'),

                btnClass:
                    'bg-amber-500 text-white hover:bg-amber-600',

                action:
                    "openServiceCategory('email')"
            },

            {
                icon:
                    'fa-wand-magic-sparkles',

                iconBg:
                    'bg-rose-100 text-rose-600',

                title:
                    t('catAi'),

                desc:
                    t('catAiDesc'),

                badge:
                    null,

                btnText:
                    t('btnBuy'),

                btnClass:
                    'bg-rose-500 text-white hover:bg-rose-600',

                action:
                    "openServiceCategory('website')"
            }
        ];

        grid.innerHTML =
            cards.map(
                card => `
                    <div class="group relative bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col gap-4 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-200">

                        <div class="flex items-start justify-between">

                            <div class="w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center text-lg">

                                <i class="fa-solid ${card.icon}"></i>

                            </div>

                            ${
                                card.badge
                                    ? `
                                        <span class="absolute top-4 right-4 w-7 h-7 rounded-lg ${card.badgeColor} text-white text-xs font-bold flex items-center justify-center shadow-sm">
                                            ${card.badge}
                                        </span>
                                    `
                                    : ''
                            }

                        </div>

                        <div class="flex-1">

                            <h3 class="font-semibold text-slate-900 text-[15px] leading-snug">
                                ${card.title}
                            </h3>

                            <p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
                                ${card.desc}
                            </p>

                        </div>

                        <button
                            onclick="${card.action}"
                            class="w-full py-2.5 rounded-xl text-sm font-semibold ${card.btnClass} transition"
                        >
                            ${card.btnText}
                        </button>

                    </div>
                `
            ).join('');
    }


    // ======================================================
    // GİRİŞ / KAYIT
    // ======================================================

    function openLoginModal() {
        const modal =
            document.getElementById(
                'loginModal'
            );

        if (modal) {
            modal.classList.remove(
                'hidden'
            );
        }

        showLoginFormView();
    }

    function closeLoginModal() {
        const modal =
            document.getElementById(
                'loginModal'
            );

        if (modal) {
            modal.classList.add(
                'hidden'
            );
        }
    }

function showLoginFormView() {
    const loginForm =
        document.getElementById(
            'loginForm'
        );

    const forgotForm =
        document.getElementById(
            'forgotPasswordForm'
        );

    const verifyView =
        document.getElementById(
            'verifyCodeView'
        );

    const newPasswordView =
        document.getElementById(
            'newPasswordView'
        );

    if (loginForm) {
        loginForm.classList.remove(
            'hidden'
        );
    }

    if (forgotForm) {
        forgotForm.classList.add(
            'hidden'
        );
    }

    if (verifyView) {
        verifyView.classList.add(
            'hidden'
        );
    }

    if (newPasswordView) {
        newPasswordView.classList.add(
            'hidden'
        );
    }


    // ======================================================
    // LOGIN ALANLARINI TEMİZLE
    // ======================================================

    const loginEmail =
        document.getElementById(
            'loginEmail'
        );

    const loginPassword =
        document.getElementById(
            'loginPassword'
        );

    const rememberMe =
        document.getElementById(
            'rememberMe'
        );

    if (loginEmail) {
        loginEmail.value = '';
    }

    if (loginPassword) {
        loginPassword.value = '';
    }

    if (rememberMe) {
        rememberMe.checked = false;
    }


    // ======================================================
    // ŞİFREMİ UNUTTUM ALANLARINI TEMİZLE
    // ======================================================

    const forgotEmail =
        document.getElementById(
            'forgotEmail'
        );

    const verificationCode =
        document.getElementById(
            'verificationCodeInput'
        );

    const newPassword =
        document.getElementById(
            'newPasswordInput'
        );

    if (forgotEmail) {
        forgotEmail.value = '';
    }

    if (verificationCode) {
        verificationCode.value = '';
    }

    if (newPassword) {
        newPassword.value = '';
    }


    // ======================================================
    // HATA MESAJLARINI TEMİZLE
    // ======================================================

    const errorBoxes = [
        'loginErrorMsg',
        'forgotErrorMsg',
        'verifyErrorMsg',
        'newPassErrorMsg'
    ];

    errorBoxes.forEach(
        id => {
            const box =
                document.getElementById(
                    id
                );

            if (box) {
                box.textContent = '';

                box.classList.add(
                    'hidden'
                );
            }
        }
    );


    // ======================================================
    // RESET DEĞİŞKENLERİNİ TEMİZLE
    // ======================================================

    resetTargetEmail = '';

    if (
        typeof generatedCode !==
        'undefined'
    ) {
        generatedCode = '';
    }
}

    function showForgotPasswordView() {
        const title =
            document.getElementById(
                'loginModalTitle'
            );

        const loginForm =
            document.getElementById(
                'loginForm'
            );

        const forgot =
            document.getElementById(
                'forgotPasswordForm'
            );

        if (title) {
            title.textContent =
                'Şifremi Unuttum';
        }

        if (loginForm) {
            loginForm.classList.add(
                'hidden'
            );
        }

        if (forgot) {
            forgot.classList.remove(
                'hidden'
            );
        }
    }
async function handleForgotPassword(
    event
) {
    event.preventDefault();


    const email =
        document
            .getElementById(
                'forgotEmail'
            )
            ?.value
            .trim();


    const errorBox =
        document.getElementById(
            'forgotErrorMsg'
        );


    if (
        !email ||
        !errorBox
    ) {
        return;
    }


    resetTargetEmail =
        email;

    passwordResetToken =
        '';


    try {

        const response =
            await fetch(
                'gonder.php',
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email:
                                resetTargetEmail
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Doğrulama kodu gönderilemedi.'
            );
        }


        errorBox.classList.add(
            'hidden'
        );


        document
            .getElementById(
                'forgotPasswordForm'
            )
            ?.classList.add(
                'hidden'
            );


        document
            .getElementById(
                'verifyCodeView'
            )
            ?.classList.remove(
                'hidden'
            );


        const codeInput =
            document.getElementById(
                'verificationCodeInput'
            );

        if (codeInput) {
            codeInput.value =
                '';
        }


    } catch (error) {

        errorBox.textContent =
            error.message ||
            'Sunucu bağlantı hatası oluştu.';

        errorBox.classList.remove(
            'hidden'
        );
    }
}

async function handleVerifyCode(
    event
) {
    event.preventDefault();


    const code =
        document
            .getElementById(
                'verificationCodeInput'
            )
            ?.value
            .trim();


    const errorBox =
        document.getElementById(
            'verifyErrorMsg'
        );


    if (!errorBox) {
        return;
    }


    if (
        !/^\d{6}$/.test(
            String(
                code || ''
            )
        )
    ) {

        errorBox.textContent =
            'Doğrulama kodu 6 haneli olmalıdır.';

        errorBox.classList.remove(
            'hidden'
        );

        return;
    }


    try {

        const response =
            await fetch(
                'kod_dogrula.php',
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email:
                                resetTargetEmail,

                            code:
                                code
                        })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !data.reset_token
        ) {

            throw new Error(
                data.message ||
                'Doğrulama kodu geçersiz.'
            );
        }


        passwordResetToken =
            String(
                data.reset_token
            );


        errorBox.classList.add(
            'hidden'
        );


        document
            .getElementById(
                'verifyCodeView'
            )
            ?.classList.add(
                'hidden'
            );


        document
            .getElementById(
                'newPasswordView'
            )
            ?.classList.remove(
                'hidden'
            );


        const passwordInput =
            document.getElementById(
                'newPasswordInput'
            );

        if (passwordInput) {
            passwordInput.value =
                '';
        }


    } catch (error) {

        passwordResetToken =
            '';


        errorBox.textContent =
            error.message ||
            'Kod doğrulanamadı.';

        errorBox.classList.remove(
            'hidden'
        );
    }
}

async function handleUpdatePassword(
    event
) {
    event.preventDefault();


    const passwordInput =
        document.getElementById(
            'newPasswordInput'
        );


    const errorBox =
        document.getElementById(
            'newPassErrorMsg'
        );


    if (
        !passwordInput ||
        !errorBox
    ) {
        return;
    }


    const password =
        passwordInput.value;


    if (
        password.length < 8
    ) {

        errorBox.textContent =
            'Şifre en az 8 karakter olmalıdır.';

        errorBox.classList.remove(
            'hidden'
        );

        return;
    }


    if (
        password.length > 72
    ) {

        errorBox.textContent =
            'Şifre en fazla 72 karakter olabilir.';

        errorBox.classList.remove(
            'hidden'
        );

        return;
    }


    if (
        !/[a-z]/.test(
            password
        )
    ) {

        errorBox.textContent =
            'Şifre en az bir küçük harf içermelidir.';

        errorBox.classList.remove(
            'hidden'
        );

        return;
    }


    if (
        !/[A-Z]/.test(
            password
        )
    ) {

        errorBox.textContent =
            'Şifre en az bir büyük harf içermelidir.';

        errorBox.classList.remove(
            'hidden'
        );

        return;
    }


    if (
        !/[0-9]/.test(
            password
        )
    ) {

        errorBox.textContent =
            'Şifre en az bir rakam içermelidir.';

        errorBox.classList.remove(
            'hidden'
        );

        return;
    }


    if (
        !resetTargetEmail ||
        !passwordResetToken
    ) {

        errorBox.textContent =
            'Şifre sıfırlama oturumunun süresi dolmuş. Yeniden kod isteyin.';

        errorBox.classList.remove(
            'hidden'
        );

        return;
    }


    try {

        const response =
            await fetch(
                'sifre_sifirla.php',
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email:
                                resetTargetEmail,

                            password:
                                password,

                            reset_token:
                                passwordResetToken
                        })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                'Şifre değiştirilemedi.'
            );
        }


        passwordResetToken =
            '';

        resetTargetEmail =
            '';

        errorBox.classList.add(
            'hidden'
        );


        showToast(
            'Başarılı',
            'Şifreniz başarıyla güncellendi.'
        );


        setTimeout(
            () => {

                closeLoginModal();

                showLoginFormView();

                openLoginModal();

            },
            700
        );


    } catch (error) {

        errorBox.textContent =
            error.message ||
            'Şifre değiştirilemedi.';

        errorBox.classList.remove(
            'hidden'
        );
    }
}

 async function handleLogin(event) {
    event.preventDefault();

    const emailEl =
        document.getElementById(
            'loginEmail'
        );

    const passwordEl =
        document.getElementById(
            'loginPassword'
        );

    const errorBox =
        document.getElementById(
            'loginErrorMsg'
        );

    if (
        !emailEl ||
        !passwordEl ||
        !errorBox
    ) {
        return;
    }

    const email =
        emailEl.value.trim();

    const password =
        passwordEl.value.trim();

    if (
        !email ||
        !password
    ) {
        errorBox.textContent =
            'E-posta ve şifrenizi girin.';

        errorBox.classList.remove(
            'hidden'
        );

        return;
    }

    try {

        const response =
            await fetch(
                'https://anazhosting-backend.onrender.com/api/auth/login',
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email,
                            password
                        })
                }
            );

        const data =
            await response.json();

        // ======================================================
        // E-POSTA DOĞRULANMAMIŞ
        // ======================================================

        if (
            response.status === 403 &&
            data.requiresEmailVerification
        ) {

            errorBox.classList.add(
                'hidden'
            );

            const verificationEmail =
                data.email ||
                email;

            try {

                const mailResponse =
                    await fetch(
                        'email_dogrulama_gonder.php',
                        {
                            method:
                                'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify({
                                    email:
                                        verificationEmail
                                })
                        }
                    );

                const mailData =
                    await mailResponse.json();

                if (!mailResponse.ok) {

                    errorBox.textContent =
                        mailData.message ||
                        'Doğrulama kodu gönderilemedi.';

                    errorBox.classList.remove(
                        'hidden'
                    );

                    return;
                }

                closeLoginModal();

                openEmailVerificationModal(
                    verificationEmail
                );

                showToast(
                    'E-posta Doğrulama',
                    'Yeni doğrulama kodu e-posta adresine gönderildi.'
                );

                return;

            } catch (mailError) {

                console.error(
                    'EMAIL VERIFICATION SEND ERROR:',
                    mailError
                );

                errorBox.textContent =
                    'Doğrulama kodu gönderilemedi.';

                errorBox.classList.remove(
                    'hidden'
                );

                return;
            }
        }


        // ======================================================
        // NORMAL LOGIN HATASI
        // ======================================================

        if (!response.ok) {

            errorBox.textContent =
                data.message ||
                'Giriş başarısız.';

            errorBox.classList.remove(
                'hidden'
            );

            return;
        }


        // ======================================================
        // GİRİŞ BAŞARILI
        // ======================================================

        errorBox.classList.add(
            'hidden'
        );

        currentUser =
            data.user;

        localStorage.setItem(
            'vortex_logged_user',
            JSON.stringify(
                currentUser
            )
        );

        localStorage.setItem(
            'vortex_token',
            data.token
        );

        closeLoginModal();

        updateAuthUI();

        showToast(
            'Giriş Başarılı',
            `Hoş geldin, ${currentUser.name}!`
        );

    } catch (error) {

        console.error(
            'LOGIN ERROR:',
            error
        );

        errorBox.textContent =
            'Backend bağlantısı kurulamadı.';

        errorBox.classList.remove(
            'hidden'
        );
    }
}
    function openRegisterModal() {
        const modal =
            document.getElementById(
                'registerModal'
            );

        if (modal) {
            modal.classList.remove(
                'hidden'
            );
        }
    }

    function closeRegisterModal() {
        const modal =
            document.getElementById(
                'registerModal'
            );

        if (modal) {
            modal.classList.add(
                'hidden'
            );
        }
    }
async function handleRegister(e) {
    e.preventDefault();

    const firstName =
        document
            .getElementById(
                'regFirstName'
            )
            ?.value
            .trim();

    const lastName =
        document
            .getElementById(
                'regLastName'
            )
            ?.value
            .trim();

    const email =
        document
            .getElementById(
                'regEmail'
            )
            ?.value
            .trim();

    const password =
        document
            .getElementById(
                'regPassword'
            )
            ?.value
            .trim();

    const errorBox =
        document.getElementById(
            'registerErrorMsg'
        );

    if (!errorBox) {
        return;
    }

    if (
        !firstName ||
        !lastName ||
        !email ||
        !password
    ) {
        errorBox.textContent =
            'Lütfen tüm zorunlu alanları doldurun.';

        errorBox.classList.remove(
            'hidden'
        );

        return;
    }

    const fullName =
        `${firstName} ${lastName}`.trim();

    try {

        const response =
            await fetch(
                'https://anazhosting-backend.onrender.com/api/auth/register',
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            name:
                                fullName,

                            email,
                            password
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            errorBox.textContent =
                data.message ||
                'Kayıt başarısız.';

            errorBox.classList.remove(
                'hidden'
            );

            return;
        }

        errorBox.classList.add(
            'hidden'
        );

        const mailResponse =
            await fetch(
                'email_dogrulama_gonder.php',
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email:
                                email
                        })
                }
            );

        const mailData =
            await mailResponse.json();

        if (!mailResponse.ok) {

            errorBox.textContent =
                mailData.message ||
                'Doğrulama kodu gönderilemedi.';

            errorBox.classList.remove(
                'hidden'
            );

            return;
        }

        closeRegisterModal();

        showToast(
            'Kayıt Başarılı',
            'Doğrulama kodu e-posta adresine gönderildi.'
        );

        openEmailVerificationModal(
            email
        );

    } catch (error) {

        console.error(
            error
        );

        errorBox.textContent =
            'Sunucu bağlantısı kurulamadı.';

        errorBox.classList.remove(
            'hidden'
        );
    }
}

let emailVerificationTarget = '';

function openEmailVerificationModal(
    email
) {
    emailVerificationTarget =
        String(
            email || ''
        )
        .trim();

    const modal =
        document.getElementById(
            'emailVerificationModal'
        );

    const emailText =
        document.getElementById(
            'emailVerificationAddress'
        );

    const codeInput =
        document.getElementById(
            'emailVerificationCode'
        );

    const errorBox =
        document.getElementById(
            'emailVerificationError'
        );

    if (emailText) {
        emailText.textContent =
            emailVerificationTarget;
    }

    if (codeInput) {
        codeInput.value =
            '';
    }

    if (errorBox) {
        errorBox.textContent =
            '';

        errorBox.classList.add(
            'hidden'
        );
    }

 if (modal) {
    modal.classList.remove(
        'hidden'
    );

    modal.classList.add(
        'flex'
    );
}
}

function closeEmailVerificationModal() {
    const modal =
        document.getElementById(
            'emailVerificationModal'
        );

    if (modal) {
        modal.classList.add(
            'hidden'
        );

        modal.classList.remove(
            'flex'
        );
    }
}


async function handleEmailVerification(
    event
) {
    event.preventDefault();

    const code =
        document
            .getElementById(
                'emailVerificationCode'
            )
            ?.value
            .trim();

    const errorBox =
        document.getElementById(
            'emailVerificationError'
        );

    if (!errorBox) {
        return;
    }

    if (
        !/^[0-9]{6}$/.test(
            code || ''
        )
    ) {
        errorBox.textContent =
            '6 haneli doğrulama kodunu girin.';

        errorBox.classList.remove(
            'hidden'
        );

        return;
    }

    try {

        const response =
            await fetch(
                'email_dogrula.php',
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email:
                                emailVerificationTarget,

                            code:
                                code
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            errorBox.textContent =
                data.message ||
                'Doğrulama başarısız.';

            errorBox.classList.remove(
                'hidden'
            );

            return;
        }

        errorBox.classList.add(
            'hidden'
        );

        closeEmailVerificationModal();

        showToast(
            'E-posta Doğrulandı',
            'Hesabın doğrulandı. Artık giriş yapabilirsin.'
        );

     setTimeout(
    () => {
        openLoginModal();
    },
    300
);

    } catch (error) {

        console.error(
            error
        );

        errorBox.textContent =
            'Doğrulama sunucusuna bağlanılamadı.';

        errorBox.classList.remove(
            'hidden'
        );
    }
}


async function resendEmailVerificationCode() {
    const errorBox =
        document.getElementById(
            'emailVerificationError'
        );

    if (!emailVerificationTarget) {
        return;
    }

    try {

        const response =
            await fetch(
                'email_dogrulama_gonder.php',
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email:
                                emailVerificationTarget
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            if (errorBox) {
                errorBox.textContent =
                    data.message ||
                    'Yeni kod gönderilemedi.';

                errorBox.classList.remove(
                    'hidden'
                );
            }

            return;
        }

        if (errorBox) {
            errorBox.classList.add(
                'hidden'
            );
        }

        showToast(
            'Kod Gönderildi',
            'Yeni doğrulama kodu e-posta adresine gönderildi.'
        );

    } catch (error) {

        console.error(
            error
        );

        if (errorBox) {
            errorBox.textContent =
                'Yeni kod gönderilemedi.';

            errorBox.classList.remove(
                'hidden'
            );
        }
    }
}


    // ======================================================
    // DESTEK
    // ======================================================

    function openNewTicketModal() {
        const modal =
            document.getElementById(
                'newTicketModal'
            );

        if (modal) {
            modal.classList.remove(
                'hidden'
            );
        }
    }

    function closeNewTicketModal() {
        const modal =
            document.getElementById(
                'newTicketModal'
            );

        if (modal) {
            modal.classList.add(
                'hidden'
            );
        }
    }

    function submitTicket(e) {
        e.preventDefault();

        closeNewTicketModal();

        showToast(
            'Talep Oluşturuldu',
            'Destek talebiniz başarıyla alındı.'
        );
    }


    // ======================================================
    // CHAT
    // ======================================================

    function toggleChatWindow() {
        isChatOpen =
            !isChatOpen;

        const win =
            document.getElementById(
                'chatWindow'
            );

        const icon =
            document.getElementById(
                'chatButtonIcon'
            );

        if (
            !win ||
            !icon
        ) {
            return;
        }

        if (isChatOpen) {

            win.classList.remove(
                'hidden'
            );

            icon.className =
                'fa-solid fa-xmark text-xl';

            loadChatHistory();

        } else {

            win.classList.add(
                'hidden'
            );

            icon.className =
                'fa-solid fa-headset text-xl';
        }
    }

    function loadChatHistory() {
        const box =
            document.getElementById(
                'chatMessages'
            );

        if (!box) {
            return;
        }

        const messages =
            JSON.parse(
                localStorage.getItem(
                    'vortex_chat_messages'
                )
            ) || {};

        const userMessages =
            messages[currentUserId] ||
            [];

        box.innerHTML = '';

        if (
            userMessages.length === 0
        ) {

            appendBotMessage(
                'Merhaba! ANAZHOSTING Destek ekibine hoş geldiniz. Size nasıl yardımcı olabiliriz?'
            );

            return;
        }

        userMessages.forEach(
            message => {

                if (
                    message.sender ===
                    'user'
                ) {

                    box.innerHTML += `
                        <div class="flex items-start justify-end gap-2.5">

                            <div class="bg-sky-500 text-white p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[80%] text-sm">
                                ${message.text}
                            </div>

                        </div>
                    `;

                } else {

                    box.innerHTML += `
                        <div class="flex items-start gap-2.5">

                            <div class="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                V
                            </div>

                            <div class="bg-white border border-slate-200 text-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] text-sm">
                                ${message.text}
                            </div>

                        </div>
                    `;
                }
            }
        );

        box.scrollTop =
            box.scrollHeight;
    }

    function appendBotMessage(text) {
        const box =
            document.getElementById(
                'chatMessages'
            );

        if (!box) {
            return;
        }

        box.innerHTML += `
            <div class="flex items-start gap-2.5">

                <div class="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    V
                </div>

                <div class="bg-white border border-slate-200 text-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] text-sm">
                    ${text}
                </div>

            </div>
        `;

        box.scrollTop =
            box.scrollHeight;
    }

    function sendChatMessage(e) {
        e.preventDefault();

        const input =
            document.getElementById(
                'chatInput'
            );

        if (!input) {
            return;
        }

        const text =
            input.value.trim();

        if (!text) {
            return;
        }

        const messages =
            JSON.parse(
                localStorage.getItem(
                    'vortex_chat_messages'
                )
            ) || {};

        if (
            !messages[currentUserId]
        ) {
            messages[currentUserId] = [];
        }

        messages[currentUserId].push({
            sender:
                'user',

            text,

            time:
                new Date()
                    .toLocaleTimeString()
        });

        localStorage.setItem(
            'vortex_chat_messages',
            JSON.stringify(
                messages
            )
        );

        input.value = '';

        loadChatHistory();
    }


    // ======================================================
    // DİL SİSTEMİ
    // ======================================================

    function t(key) {
        return (
            translations[currentLang]?.[key] ||
            translations.tr?.[key] ||
            key
        );
    }

    const translations = {

        tr: {

            heroTitle:
                'Yüksek Performanslı<br><span class="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Bulut Hosting</span>',

            heroDesc:
                'NVMe SSD, ücretsiz SSL ve 7/24 uzman destek ile sitenizi hızla yayınlayın.',

            searchPlaceholder:
                'Domain adınızı yazın (örnek: siteadi.com)',

            searchBtn:
                'Sorgula',

            navHome:
                'Ana Sayfa',

            navServices:
                'Hizmetlerimiz',

            navDomain:
                'Domain Sorgula',

            login:
                'Giriş Yap',

            register:
                'Kayıt Ol',

            logout:
                'Çıkış Yap',

            uptimeBadge:
                '%99.9 Uptime Garantisi',

            btnReviewServices:
                'Hizmetleri İncele',

            btnDomainSearch:
                'Domain Sorgula',

            featNvme:
                'NVMe SSD',

            featNvmeDesc:
                'Yüksek hızlı depolama',

            featSsl:
                'Ücretsiz SSL',

            featSslDesc:
                'Sectigo sertifikası',

            featSupport:
                '7/24 Destek',

            featSupportDesc:
                'Uzman teknik ekip',

            featUptime:
                '%99.9 Uptime',

            featUptimeDesc:
                'Kesintisiz hizmet',

            servicesTitle:
                'Hizmetlerimiz',

            servicesSubtitle:
                'İhtiyacınıza uygun hizmeti seçin, paketleri inceleyin',

            catDomain:
                'Domain / Alan Adı',

            catDomainDesc:
                'İstediğiniz domaini sorgulayın ve hemen kaydedin',

            catHosting:
                'Hosting Hizmetleri',

            catHostingDesc:
                "₺29.90'dan başlayan fiyatlarla %100 SSD, yüksek performanslı hosting",

            catVds:
                'Sunucu Kiralama',

            catVdsDesc:
                'Güçlü altyapı ve ışık hızında performans sunan VDS paketleri',

            catSsl:
                'SSL Sertifikası',

            catSslDesc:
                'Web sitenizi güven altına alın, arama motorlarında üst sıralara çıkın',

            catEmail:
                'Kurumsal E-Posta',

            catEmailDesc:
                'Alan adınıza özel yüksek kapasiteli kurumsal e-posta adresi',

            catAi:
                'Yapay Zeka Destekli Hazır Web Sitesi',

            catAiDesc:
                'Kod bilgisine gerek duymadan hazır temalardan seçin ve yayınlayın',

            btnBuy:
                'Satın Al',

            btnQuery:
                'Sorgula',

            btnManage:
                'Yönet →',

            back:
                'Geri Dön',

            packages:
                'Paketler',

            choosePackage:
                'Size uygun paketi seçin',

            monthly:
                'Aylık',

            yearly:
                'Yıllık',

            addToCart:
                'Sepete Ekle',

            popular:
                'POPÜLER',

            activeDomains:
                'Aktif Alan Adları',

            activeDomainsDesc:
                'Kayıt süresi devam eden aktif alan adları',

            activeDomainsCount:
                'adet kayıtlı domaininiz var',

            hostingTitle:
                'Hosting Paketleri',

            hostingDesc:
                'NVMe SSD, ücretsiz SSL ile yüksek performanslı hosting',

            vdsTitle:
                'Sunucu Kiralama (VDS)',

            vdsDesc:
                'Güçlü altyapı ve yüksek performanslı sanal sunucular',

            sslTitle:
                'SSL Sertifikaları',

            sslDesc:
                'Sitenizi güven altına alın, arama motorlarında yükselin',

            emailTitle:
                'Kurumsal E-Posta',

            emailDesc:
                'Alan adınıza özel profesyonel e-posta çözümleri',

            soonTitle:
                'Yakında',

            soonMsg:
                'AI web sitesi özelliği çok yakında aktif olacak!',

            chatPlaceholder:
                'Mesajınızı yazın...'
        },

        en: {

            heroTitle:
                'High-Performance<br><span class="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Cloud Hosting</span>',

            heroDesc:
                'Launch your website quickly with NVMe SSD, free SSL, and 24/7 expert support.',

            searchPlaceholder:
                'Type your domain name',

            searchBtn:
                'Search',

            navHome:
                'Home',

            navServices:
                'Our Services',

            navDomain:
                'Domain Search',

            login:
                'Log In',

            register:
                'Sign Up',

            logout:
                'Log Out',

            uptimeBadge:
                '99.9% Uptime Guarantee',

            btnReviewServices:
                'Browse Services',

            btnDomainSearch:
                'Search Domain',

            featNvme:
                'NVMe SSD',

            featNvmeDesc:
                'High-speed storage',

            featSsl:
                'Free SSL',

            featSslDesc:
                'Sectigo certificate',

            featSupport:
                '24/7 Support',

            featSupportDesc:
                'Expert technical team',

            featUptime:
                '99.9% Uptime',

            featUptimeDesc:
                'Uninterrupted service',

            servicesTitle:
                'Our Services',

            servicesSubtitle:
                'Choose the service you need and explore packages',

            catDomain:
                'Domain Name',

            catDomainDesc:
                'Search for your domain and register instantly',

            catHosting:
                'Hosting Services',

            catHostingDesc:
                'High-performance SSD hosting',

            catVds:
                'Server Rental',

            catVdsDesc:
                'Powerful VDS packages',

            catSsl:
                'SSL Certificate',

            catSslDesc:
                'Secure your website',

            catEmail:
                'Business Email',

            catEmailDesc:
                'Professional email for your domain',

            catAi:
                'AI-Powered Ready Website',

            catAiDesc:
                'Publish a website without coding',

            btnBuy:
                'Buy Now',

            btnQuery:
                'Search',

            btnManage:
                'Manage →',

            back:
                'Go Back',

            packages:
                'Packages',

            choosePackage:
                'Choose the package that fits you',

            monthly:
                'Monthly',

            yearly:
                'Yearly',

            addToCart:
                'Add to Cart',

            popular:
                'POPULAR',

            activeDomains:
                'Active Domains',

            activeDomainsDesc:
                'Your active domain names',

            activeDomainsCount:
                'registered domain(s)',

            hostingTitle:
                'Hosting Packages',

            hostingDesc:
                'High-performance hosting with NVMe SSD and free SSL',

            vdsTitle:
                'Server Rental (VDS)',

            vdsDesc:
                'High-performance virtual servers',

            sslTitle:
                'SSL Certificates',

            sslDesc:
                'Secure your website',

            emailTitle:
                'Business Email',

            emailDesc:
                'Professional email solutions',

            soonTitle:
                'Coming Soon',

            soonMsg:
                'AI website feature will be available soon!',

            chatPlaceholder:
                'Type your message...'
        }
    };

    function setLanguage(lang) {
        currentLang =
            lang;

        localStorage.setItem(
            'vortex_lang',
            lang
        );

        updateTexts();
    }

    function updateTexts() {
        document
            .querySelectorAll(
                '[data-i18n]'
            )
            .forEach(
                el => {

                    const key =
                        el.getAttribute(
                            'data-i18n'
                        );

                    if (
                        translations[currentLang]?.[key]
                    ) {

                        el.innerHTML =
                            translations[currentLang][key];
                    }
                }
            );

        document
            .querySelectorAll(
                '[data-i18n-placeholder]'
            )
            .forEach(
                el => {

                    const key =
                        el.getAttribute(
                            'data-i18n-placeholder'
                        );

                    if (
                        translations[currentLang]?.[key]
                    ) {

                        el.placeholder =
                            translations[currentLang][key];
                    }
                }
            );

        const domainInput =
            document.getElementById(
                'domainInput'
            );

        if (domainInput) {
            domainInput.placeholder =
                t('searchPlaceholder');
        }

        const trBtn =
            document.getElementById(
                'langTrBtn'
            );

        const enBtn =
            document.getElementById(
                'langEnBtn'
            );

        if (
            trBtn &&
            enBtn
        ) {

            if (
                currentLang === 'tr'
            ) {

                trBtn.className =
                    'px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-sky-600 shadow-sm transition';

                enBtn.className =
                    'px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition';

            } else {

                enBtn.className =
                    'px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-sky-600 shadow-sm transition';

                trBtn.className =
                    'px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition';
            }
        }

        renderHomeServiceCards();

        if (
            typeof renderDashboardServiceCards ===
            'function'
        ) {

            renderDashboardServiceCards();
        }

        if (
            currentServiceCategory
        ) {

            renderServicePlansPage();
        }
    }

    function playNotificationSound() {
        try {

            const audioCtx =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

            const oscillator =
                audioCtx.createOscillator();

            const gainNode =
                audioCtx.createGain();

            oscillator.type =
                'sine';

            oscillator.frequency
                .setValueAtTime(
                    587.33,
                    audioCtx.currentTime
                );

            oscillator.frequency
                .exponentialRampToValueAtTime(
                    880,
                    audioCtx.currentTime +
                    0.08
                );

            gainNode.gain
                .setValueAtTime(
                    0.15,
                    audioCtx.currentTime
                );

            gainNode.gain
                .exponentialRampToValueAtTime(
                    0.01,
                    audioCtx.currentTime +
                    0.15
                );

            oscillator.connect(
                gainNode
            );

            gainNode.connect(
                audioCtx.destination
            );

            oscillator.start();

            oscillator.stop(
                audioCtx.currentTime +
                0.15
            );

        } catch (e) {

            console.log(
                'Ses çalınamadı:',
                e
            );
        }
    }
// ======================================================
// ANAZHOSTING - ŞİFRE SIFIRLAMA
// ======================================================

let passwordResetEmail = '';


// ======================================================
// ŞİFRE SIFIRLAMA KODU GÖNDER
// ======================================================

async function sendPasswordResetCode() {
    const emailInput =
        document.getElementById(
            'forgotPasswordEmail'
        );

    const email =
        emailInput?.value
            .trim()
            .toLowerCase();

    if (!email) {
        showToast(
            'Hata',
            'E-posta adresinizi girin.'
        );

        return;
    }

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        showToast(
            'Hata',
            'Geçerli bir e-posta adresi girin.'
        );

        return;
    }

    try {
        const response =
            await fetch(
                'gonder.php',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Doğrulama kodu gönderilemedi.'
            );
        }

        if (!data.success) {
            throw new Error(
                data.message ||
                'Doğrulama kodu gönderilemedi.'
            );
        }

        passwordResetEmail =
            email;

        showToast(
            'Kod Gönderildi',
            'Doğrulama kodu e-posta adresinize gönderildi.'
        );

        openPasswordResetCodeModal();

    } catch (error) {
        console.error(
            'PASSWORD RESET SEND ERROR:',
            error
        );

        showToast(
            'Şifre Sıfırlama',
            error.message ||
            'Sunucu bağlantı hatası oluştu.'
        );
    }
}


// ======================================================
// KOD GİRME MODALI
// ======================================================

function openPasswordResetCodeModal() {
    const oldModal =
        document.getElementById(
            'passwordResetCodeModal'
        );

    if (oldModal) {
        oldModal.remove();
    }

    const modal =
        document.createElement(
            'div'
        );

    modal.id =
        'passwordResetCodeModal';

    modal.className =
        'modal-overlay active';

    modal.innerHTML = `
        <div class="auth-modal">

            <button
                type="button"
                class="auth-modal-close"
                onclick="closePasswordResetCodeModal()"
            >
                ×
            </button>

            <h2>
                Doğrulama Kodu
            </h2>

            <p>
                <strong>
                    ${escapeHtmlPasswordReset(passwordResetEmail)}
                </strong>
                adresine gönderilen
                6 haneli kodu girin.
            </p>

            <div class="form-group">

                <label>
                    DOĞRULAMA KODU
                </label>

                <input
                    id="passwordResetCode"
                    type="text"
                    inputmode="numeric"
                    maxlength="6"
                    autocomplete="one-time-code"
                    placeholder="000000"
                >

            </div>

            <div
                id="passwordResetCodeError"
                class="auth-error"
                style="display:none;"
            ></div>

            <div class="auth-modal-actions">

                <button
                    type="button"
                    class="btn-secondary"
                    onclick="closePasswordResetCodeModal()"
                >
                    İptal
                </button>

                <button
                    type="button"
                    class="btn-primary"
                    onclick="verifyPasswordResetCode()"
                >
                    Kodu Doğrula
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    setTimeout(
        () => {
            document
                .getElementById(
                    'passwordResetCode'
                )
                ?.focus();
        },
        50
    );
}


// ======================================================
// KOD MODALINI KAPAT
// ======================================================

function closePasswordResetCodeModal() {
    document
        .getElementById(
            'passwordResetCodeModal'
        )
        ?.remove();
}


// ======================================================
// KOD DOĞRULA
// ======================================================

async function verifyPasswordResetCode() {
    const codeInput =
        document.getElementById(
            'passwordResetCode'
        );

    const errorBox =
        document.getElementById(
            'passwordResetCodeError'
        );

    const code =
        codeInput?.value
            .trim();

    if (
        !code ||
        !/^\d{6}$/.test(code)
    ) {
        showPasswordResetError(
            errorBox,
            '6 haneli doğrulama kodunu girin.'
        );

        return;
    }

    if (!passwordResetEmail) {
        showPasswordResetError(
            errorBox,
            'Şifre sıfırlama oturumu bulunamadı.'
        );

        return;
    }

    try {
        const response =
            await fetch(
                'kod_dogrula.php',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email:
                                passwordResetEmail,

                            code
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Kod doğrulanamadı.'
            );
        }

        if (!data.success) {
            throw new Error(
                data.message ||
                'Kod doğrulanamadı.'
            );
        }

        closePasswordResetCodeModal();

        showToast(
            'Başarılı',
            'Kod doğrulandı.'
        );

        openNewPasswordModal();

    } catch (error) {
        console.error(
            'PASSWORD RESET VERIFY ERROR:',
            error
        );

        showPasswordResetError(
            errorBox,
            error.message
        );
    }
}


// ======================================================
// YENİ ŞİFRE MODALI
// ======================================================

function openNewPasswordModal() {
    const oldModal =
        document.getElementById(
            'newPasswordModal'
        );

    if (oldModal) {
        oldModal.remove();
    }

    const modal =
        document.createElement(
            'div'
        );

    modal.id =
        'newPasswordModal';

    modal.className =
        'modal-overlay active';

    modal.innerHTML = `
        <div class="auth-modal">

            <button
                type="button"
                class="auth-modal-close"
                onclick="closeNewPasswordModal()"
            >
                ×
            </button>

            <h2>
                Yeni Şifre
            </h2>

            <p>
                Hesabınız için yeni bir
                şifre belirleyin.
            </p>

            <div class="form-group">

                <label>
                    YENİ ŞİFRE
                </label>

                <input
                    id="newResetPassword"
                    type="password"
                    autocomplete="new-password"
                    placeholder="En az 8 karakter"
                >

            </div>

            <div class="form-group">

                <label>
                    YENİ ŞİFRE TEKRAR
                </label>

                <input
                    id="newResetPasswordAgain"
                    type="password"
                    autocomplete="new-password"
                    placeholder="Şifrenizi tekrar girin"
                >

            </div>

            <div
                id="newPasswordError"
                class="auth-error"
                style="display:none;"
            ></div>

            <div class="auth-modal-actions">

                <button
                    type="button"
                    class="btn-secondary"
                    onclick="closeNewPasswordModal()"
                >
                    İptal
                </button>

                <button
                    type="button"
                    class="btn-primary"
                    onclick="saveNewPassword()"
                >
                    Şifreyi Değiştir
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    setTimeout(
        () => {
            document
                .getElementById(
                    'newResetPassword'
                )
                ?.focus();
        },
        50
    );
}


// ======================================================
// YENİ ŞİFRE MODALINI KAPAT
// ======================================================

function closeNewPasswordModal() {
    document
        .getElementById(
            'newPasswordModal'
        )
        ?.remove();
}


// ======================================================
// YENİ ŞİFREYİ KAYDET
// ======================================================

async function saveNewPassword() {
    const passwordInput =
        document.getElementById(
            'newResetPassword'
        );

    const passwordAgainInput =
        document.getElementById(
            'newResetPasswordAgain'
        );

    const errorBox =
        document.getElementById(
            'newPasswordError'
        );

    const password =
        passwordInput?.value || '';

    const passwordAgain =
        passwordAgainInput?.value || '';

    if (password.length < 8) {
        showPasswordResetError(
            errorBox,
            'Şifre en az 8 karakter olmalıdır.'
        );

        return;
    }

    if (
        password !==
        passwordAgain
    ) {
        showPasswordResetError(
            errorBox,
            'Şifreler birbiriyle eşleşmiyor.'
        );

        return;
    }

    if (!passwordResetEmail) {
        showPasswordResetError(
            errorBox,
            'Şifre sıfırlama oturumu bulunamadı.'
        );

        return;
    }

    try {
        const response =
            await fetch(
                'sifre_sifirla.php',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email:
                                passwordResetEmail,

                            password
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Şifre değiştirilemedi.'
            );
        }

        if (!data.success) {
            throw new Error(
                data.message ||
                'Şifre değiştirilemedi.'
            );
        }

        closeNewPasswordModal();

        passwordResetEmail =
            '';

        showToast(
            'Şifre Değiştirildi',
            'Yeni şifreniz başarıyla kaydedildi. Artık giriş yapabilirsiniz.'
        );

    } catch (error) {
        console.error(
            'PASSWORD RESET SAVE ERROR:',
            error
        );

        showPasswordResetError(
            errorBox,
            error.message
        );
    }
}


// ======================================================
// HATA MESAJI
// ======================================================

function showPasswordResetError(
    element,
    message
) {
    if (!element) {
        showToast(
            'Hata',
            message
        );

        return;
    }

    element.textContent =
        message;

    element.style.display =
        'block';
}


// ======================================================
// HTML GÜVENLİ YAZDIRMA
// ======================================================

function escapeHtmlPasswordReset(
    value
) {
    return String(
        value || ''
    )
        .replaceAll(
            '&',
            '&amp;'
        )
        .replaceAll(
            '<',
            '&lt;'
        )
        .replaceAll(
            '>',
            '&gt;'
        )
        .replaceAll(
            '"',
            '&quot;'
        )
        .replaceAll(
            "'",
            '&#039;'
        );
}