document.addEventListener("DOMContentLoaded", () => {
    initializeStoreDashboard_();
});

async function initializeStoreDashboard_() {
    const user = JSON.parse(localStorage.getItem("mnUser") || "{}");
    const customerId = user.CustomerID || "";

    setText_("storeNameText", user.StoreName || "M&N Partner Store");
    setText_("storeContactText", "Contact: " + (user.ContactNumber || "-"));

    await loadStoreSummary_(customerId, user);
    await loadDashboardOpenOrders_(customerId);
}

async function loadStoreSummary_(customerId, user) {
    try {
        const response = await fetch(API.BASE_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getStorePartnerSummary",
                customerId
            })
        });

        const result = await response.json();
        const summary = result.summary || {};

        setText_("storeNameText", summary.storeName || user.StoreName || "M&N Partner Store");
        setText_("storeTypeText", "Account Type: " + (summary.storeType || "Wholesale Store"));
        setText_("storeStatusText", "Status: " + (summary.status || "ACTIVE"));
        setText_("storeBalanceText", "Outstanding Balance: ₱" + formatMoney_(summary.outstandingBalance || 0));
        setText_("storeContactText", "Contact: " + (summary.contact || "-"));
        setText_("storeAgentText", "Assigned Agent: " + (summary.agent || "-"));

        setText_("quickOrdersToday", summary.todayOrders || 0);
        setText_("quickPendingDeliveries", summary.pendingDeliveries || 0);
        setText_("quickOutstandingBalance", "₱" + formatMoney_(summary.outstandingBalance || 0));
        setText_("quickProductsOrdered", summary.productsOrderedToday || 0);

    } catch (error) {
        console.error(error);
    }
}

async function loadDashboardOpenOrders_(customerId) {
    const tbody = document.getElementById("dashboardOpenOrdersBody");
    if (!tbody) return;

    try {
        const response = await fetch(API.BASE_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getStoreOrders",
                storeId: customerId
            })
        });

        const result = await response.json();
        const rows = result.rows || [];

        const openOrders = rows.filter(order => {
            const payment = String(order.PaymentStatus || "").toUpperCase();
            const delivery = String(order.DeliveryStatus || "").toUpperCase();

            return payment !== "PAID" || delivery !== "DELIVERED";
        });

        if (!openOrders.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">No open reminders. All clear.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = openOrders.map(order => `
            <tr>
                <td>${order.InvoiceID || "-"}</td>
                <td>${formatDate_(order.OrderDate)}</td>
                <td>${order.DeliveryStatus || "Pending"}</td>
                <td>${order.PaymentStatus || "Unpaid"}</td>
                <td>₱${formatMoney_(order.RemainingBalance || order.TotalAmount || 0)}</td>
                <td>
                    <a href="store-invoices.html" class="store-primary-btn">
                        View Invoice
                    </a>
                </td>
            </tr>
        `).join("");

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6">Unable to load reminders.</td>
            </tr>
        `;
    }
}

function setText_(id, value) {
    const element = document.getElementById(id);
    if (element) element.innerText = value;
}

function formatMoney_(value) {
    return Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate_(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}