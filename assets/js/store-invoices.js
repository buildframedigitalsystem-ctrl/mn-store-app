/* =========================================
   STORE INVOICES MODULE
   BuildFrame Store OS
========================================= */

let storeInvoiceRows = [];

document.addEventListener("DOMContentLoaded", () => {
    loadStoreInvoices_();
});

async function loadStoreInvoices_() {
    const tbody = document.getElementById("storeInvoicesTableBody");

    if (!tbody) return;

    const user = JSON.parse(localStorage.getItem("mnUser") || "{}");
    const customerId = user.CustomerID || "";

    setText_("invoiceStoreName", user.StoreName || "M&N Partner Store");

    try {
        const response = await fetch(API.BASE_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getStoreOrders",
                storeId: customerId
            })
        });

        const result = await response.json();

        if (!result.success) {
            tbody.innerHTML = `<tr><td colspan="6">Failed to load invoices.</td></tr>`;
            return;
        }

        storeInvoiceRows = result.rows || [];

        setText_("invoiceSummaryText", "Invoices: " + storeInvoiceRows.length);

        if (!storeInvoiceRows.length) {
            tbody.innerHTML = `<tr><td colspan="6">No invoices found.</td></tr>`;
            return;
        }

        tbody.innerHTML = storeInvoiceRows.map((order, index) => `
            <tr>
                <td>${order.InvoiceID || "-"}</td>
                <td>${formatDate_(order.OrderDate)}</td>
                <td>₱${formatMoney_(order.TotalAmount || 0)}</td>
                <td>${order.PaymentStatus || "Unpaid"}</td>
                <td>${order.DeliveryStatus || "Pending"}</td>
                <td>
                    <button type="button" class="store-primary-btn" onclick="openStoreInvoice_(${index})">
                        View Invoice
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="6">Connection error.</td></tr>`;
    }
}

function openStoreInvoice_(index) {
    const order = storeInvoiceRows[index];

    if (!order) return;

    setText_("invoiceIdText", order.InvoiceID || "-");
    setText_("invoiceCustomerText", order.CustomerName || "-");
    setText_("invoiceContactText", order.ContactNumber || "-");
    setText_("invoicePaymentStatusText", order.PaymentStatus || "Unpaid");
    setText_("invoiceDeliveryStatusText", order.DeliveryStatus || "Pending");
    setText_("invoiceDateText", formatDate_(order.OrderDate));
    setText_("invoiceTotalText", "₱" + formatMoney_(order.TotalAmount || 0));

    renderInvoiceItems_(order.Items || []);

    const modal = document.getElementById("invoiceModal");

    if (modal) {
        modal.style.display = "flex";
    }
}

function renderInvoiceItems_(items) {
    const tbody = document.getElementById("invoiceItemsBody");

    if (!tbody) return;

    if (!items || !items.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">No items found.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${item.ProductName || "-"}</td>
            <td>${item.Quantity || 0}</td>
            <td>₱${formatMoney_(item.UnitPrice || 0)}</td>
            <td>₱${formatMoney_(item.Subtotal || 0)}</td>
        </tr>
    `).join("");
}

function closeStoreInvoice_() {
    const modal = document.getElementById("invoiceModal");

    if (modal) {
        modal.style.display = "none";
    }
}

function setText_(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.innerText = value || "-";
    }
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

window.openStoreInvoice_ = openStoreInvoice_;
window.closeStoreInvoice_ = closeStoreInvoice_;