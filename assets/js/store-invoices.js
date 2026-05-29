/* =========================================
   STORE INVOICES MODULE
   M&N Store App
========================================= */

let storeInvoiceRows = [];

document.addEventListener("DOMContentLoaded", () => {
    loadStoreInvoices_();
});

async function loadStoreInvoices_() {
    const tbody = document.getElementById("storeInvoicesTableBody");

    if (!tbody) return;

    const user = JSON.parse(localStorage.getItem("mnUser") || "{}");

    const customerId =
        user.CustomerID ||
        user.StoreID ||
        user.customerId ||
        "";

    setText_(
        "invoiceStoreName",
        user.StoreName ||
        user.CustomerName ||
        "M&N Partner Store"
    );

    try {
        const response = await fetch(API.BASE_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getStoreOrders",
                storeId: customerId,
                customerId: customerId
            })
        });

        const result = await response.json();

        if (!result.success) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">Failed to load invoices.</td>
                </tr>
            `;
            return;
        }

        storeInvoiceRows =
            result.rows ||
            result.orders ||
            [];

        setText_(
            "invoiceSummaryText",
            "Invoices: " + storeInvoiceRows.length
        );

        if (!storeInvoiceRows.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">No invoices found.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = storeInvoiceRows.map((order, index) => `
            <tr>
                <td>${order.InvoiceID || order.OrderID || "-"}</td>
                <td>${formatDate_(order.OrderDate || order.CreatedAt)}</td>
                <td>₱${formatMoney_(order.TotalAmount || 0)}</td>
                <td>${order.PaymentStatus || "Unpaid"}</td>
                <td>${order.DeliveryStatus || "Pending"}</td>
                <td>
                    <button
                        type="button"
                        class="store-primary-btn"
                        onclick="openStoreInvoice_(${index})">
                        View Invoice
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (error) {
        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="6">Connection error.</td>
            </tr>
        `;
    }
}

function openStoreInvoice_(index) {
    const order = storeInvoiceRows[index];

    if (!order) {
        alert("Invoice record not found.");
        return;
    }

    openInvoiceModal(order);
}

function openInvoiceModal(order) {
    const modal = document.getElementById("invoiceModal");

    if (!modal) {
        alert("Invoice modal not found.");
        return;
    }

    setText_("invoiceIdText", order.InvoiceID || order.OrderID || "-");

    setText_(
        "invoiceCustomerText",
        order.CustomerName ||
        order.StoreName ||
        "M&N Partner Store"
    );

    setText_(
        "invoiceAddressText",
        order.CustomerAddress ||
        order.StoreAddress ||
        order.Address ||
        order.DeliveryAddress ||
        "-"
    );

    setText_("invoiceContactText", order.ContactNumber || "-");
    setText_("invoiceOrderTypeText", order.OrderType || "Wholesale");
    setText_("invoicePaymentStatusText", order.PaymentStatus || "Unpaid");
    setText_("invoiceDeliveryStatusText", order.DeliveryStatus || "Pending");
    setText_("invoiceDateText", formatDate_(order.OrderDate || order.CreatedAt));
    setText_("invoiceNotesText", order.Notes || order.OrderNotes || "-");

    const items = parseInvoiceItems_(order.Items);

    renderStoreInvoiceItems_(items);

    const itemsTotal =
        Number(order.TotalAmount || calculateItemsTotal_(items));

    const discount =
        Number(order.DiscountAmount || order.Discount || 0);

    const deliveryFee =
        Number(order.DeliveryFee || 0);

    const partialPayments =
        Number(order.PartialPayments || order.PartialPayment || 0);

    const returnsAmount =
        Number(order.ReturnsAmount || order.ReturnAmount || 0);

    const subtotal =
        itemsTotal - discount + deliveryFee;

    const balanceDue =
        subtotal - partialPayments - returnsAmount;

    setText_("invoiceItemsTotalText", "₱" + formatMoney_(itemsTotal));
    setText_("invoiceDiscountText", "₱" + formatMoney_(discount));
    setText_("invoiceDeliveryFeeText", "₱" + formatMoney_(deliveryFee));
    setText_("invoiceSubtotalText", "₱" + formatMoney_(subtotal));
    setText_("invoicePartialPaymentsText", "₱" + formatMoney_(partialPayments));
    setText_("invoiceReturnsText", "₱" + formatMoney_(returnsAmount));
    setText_("invoiceBalanceDueText", "₱" + formatMoney_(balanceDue));

    const signatureImage =
        document.getElementById("invoiceSignatureImage");

    if (signatureImage) {
        signatureImage.src = order.SignatureImage || "";
        signatureImage.style.display =
            order.SignatureImage ? "block" : "none";
    }

    modal.style.display = "flex";
    modal.style.visibility = "visible";
    modal.style.opacity = "1";
}

function parseInvoiceItems_(rawItems) {
    if (Array.isArray(rawItems)) {
        return rawItems;
    }

    if (typeof rawItems === "string" && rawItems.trim()) {
        try {
            return JSON.parse(rawItems);
        } catch (error) {
            console.warn("Items parse error:", error);
        }
    }

    return [];
}

function renderStoreInvoiceItems_(items) {
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

    tbody.innerHTML = items.map(item => {
        const qty =
            Number(item.Quantity || item.Qty || item.quantity || 0);

        const price =
            Number(item.UnitPrice || item.Price || item.unitPrice || item.price || 0);

        const subtotal =
            Number(item.Subtotal || item.Total || item.subtotal || item.total || qty * price);

        return `
            <tr>
                <td>${item.ProductName || item.productName || "-"}</td>
                <td>${qty}</td>
                <td>₱${formatMoney_(price)}</td>
                <td>₱${formatMoney_(subtotal)}</td>
            </tr>
        `;
    }).join("");
}

function calculateItemsTotal_(items) {
    return items.reduce((sum, item) => {
        const qty =
            Number(item.Quantity || item.Qty || item.quantity || 0);

        const price =
            Number(item.UnitPrice || item.Price || item.unitPrice || item.price || 0);

        const subtotal =
            Number(item.Subtotal || item.Total || item.subtotal || item.total || qty * price);

        return sum + subtotal;
    }, 0);
}

function closeStoreInvoice_() {
    closeInvoiceModal();
}

function closeInvoiceModal() {
    const modal = document.getElementById("invoiceModal");

    if (modal) {
        modal.style.display = "none";
        modal.style.visibility = "hidden";
        modal.style.opacity = "0";
    }
}

function printInvoiceModal() {
    const invoiceBox = document.querySelector(".invoice-box");

    if (!invoiceBox) {
        alert("Invoice content not found.");
        return;
    }

    const printWindow =
        window.open("", "PRINT", "width=900,height=700");

    if (!printWindow) {
        alert("Please allow popups to print invoice.");
        return;
    }

    printWindow.document.open();

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>M&N Invoice</title>

            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 24px;
                    color: #111827;
                    background: white;
                }

                .invoice-close-btn,
                .invoice-actions {
                    display: none !important;
                }

                .invoice-header {
                    text-align: center;
                    border-bottom: 2px solid #111827;
                    padding-bottom: 18px;
                    margin-bottom: 22px;
                }

                .invoice-header h2 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 900;
                }

                .invoice-header p {
                    margin: 8px 0;
                    color: #475569;
                }

                .invoice-contact-details {
                    margin-top: 8px;
                    font-size: 12px;
                    color: #475569;
                }

                .invoice-details-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    margin-bottom: 20px;
                }

                small {
                    display: block;
                    color: #64748b;
                    margin-bottom: 4px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }

                th,
                td {
                    padding: 10px;
                    border-bottom: 1px solid #e5e7eb;
                    text-align: left;
                }

                th {
                    background: #f1f5f9;
                }

                .invoice-summary-block {
                    margin-top: 20px;
                    padding: 16px;
                    background: #f8fafc;
                    border-radius: 12px;
                }

                .invoice-summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                }

                .total-row {
                    font-size: 20px;
                    font-weight: 900;
                }

                .invoice-notes-box {
                    margin-top: 20px;
                }

                .invoice-signature-box {
                    margin-top: 20px;
                    text-align: left;
                }

                .invoice-signature-box img {
                    max-width: 260px;
                    margin-top: 10px;
                }
            </style>
        </head>

        <body>
            ${invoiceBox.innerHTML}
        </body>
        </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 500);
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
window.openInvoiceModal = openInvoiceModal;
window.closeInvoiceModal = closeInvoiceModal;
window.printInvoiceModal = printInvoiceModal;

/* =========================================
   LIVE AUTO REFRESH
========================================= */

setInterval(() => {
    loadStoreInvoices_();
}, 15000);