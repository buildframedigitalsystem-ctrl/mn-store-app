/* =========================================
   M&N STORE ORDERS MODULE
   BuildFrame Store OS
========================================= */

let orderCart = [];
let signatureCanvas = null;
let signatureCtx = null;
let isSigning = false;

const STORE_CART_KEY = "mn_store_partner_cart";

document.addEventListener("DOMContentLoaded", () => {
    requireSessionSafe_();
    initializeSignaturePad_();
    initializeOrderButtons_();
    fillStoreInfo_();
    loadCartFromStorage_();
    loadRecentOrders_();
});

/* SESSION */

function getCurrentStoreSession_() {
    try {
        if (typeof getStoreSession_ === "function") {
            return getStoreSession_();
        }

        return JSON.parse(localStorage.getItem("mnStoreSession") || "{}");
    } catch (error) {
        return {};
    }
}

function requireSessionSafe_() {
    const session = getCurrentStoreSession_();

    if (!session.CustomerID) {
        window.location.href = "customer-login.html";
    }
}

function fillStoreInfo_() {
    const session = getCurrentStoreSession_();

    const customerNameField = document.getElementById("customerName");
    const contactField = document.getElementById("contactNumber");

    if (customerNameField) customerNameField.value = session.StoreName || "";
    if (contactField) contactField.value = session.ContactNumber || "";
}

/* API */

function getApiUrl_() {
    if (typeof API !== "undefined" && API.BASE_URL) {
        return API.BASE_URL;
    }

    return "https://script.google.com/macros/s/AKfycbzbUww2SKIl6uqQvPqLtO6L35A0Xw5Ny0N5hjq16JOguAiLUAovKMdUagJ9SgK1fOSJ/exec";
}

/* CART */

function loadCartFromStorage_() {
    try {
        const savedCart = JSON.parse(localStorage.getItem(STORE_CART_KEY) || "[]");

        orderCart = savedCart.map(item => {
            const quantity = Number(item.quantity || 1);
            const price = Number(item.price || 0);

            return {
                productId: item.productId || "",
                name: item.name || "Unnamed Product",
                category: item.category || "",
                image: item.image || "",
                quantity,
                price,
                total: quantity * price
            };
        });

        renderOrderCart_();

    } catch (error) {
        console.error(error);
        orderCart = [];
        renderOrderCart_();
    }
}

function renderOrderCart_() {
    const tbody = document.getElementById("cartTableBody");
    const totalField = document.getElementById("totalAmount");

    if (!tbody) return;

    if (!orderCart.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">No products found from cart.</td>
            </tr>
        `;

        if (totalField) totalField.value = 0;
        return;
    }

    let grandTotal = 0;

    tbody.innerHTML = orderCart.map((item, index) => {
        const qty = Number(item.quantity || 1);
        const price = Number(item.price || 0);
        const total = qty * price;

        grandTotal += total;

        return `
            <tr>
                <td>${escapeHTML_(item.name)}</td>

                <td>
                    <div class="qty-controls">
                        <button type="button" onclick="changeOrderQty_(${index}, -1)">−</button>
                        <span>${qty}</span>
                        <button type="button" onclick="changeOrderQty_(${index}, 1)">+</button>
                    </div>
                </td>

                <td>₱${formatMoney_(price)}</td>
                <td>₱${formatMoney_(total)}</td>

                <td>
                    <button type="button" class="remove-btn" onclick="removeOrderItem_(${index})">
                        Remove
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    if (totalField) totalField.value = grandTotal;
}

function changeOrderQty_(index, amount) {
    if (!orderCart[index]) return;

    orderCart[index].quantity = Math.max(
        1,
        Number(orderCart[index].quantity || 1) + amount
    );

    orderCart[index].total =
        Number(orderCart[index].quantity) *
        Number(orderCart[index].price || 0);

    saveOrderCart_();
    renderOrderCart_();
}

function removeOrderItem_(index) {
    orderCart.splice(index, 1);
    saveOrderCart_();
    renderOrderCart_();
}

function saveOrderCart_() {
    localStorage.setItem(STORE_CART_KEY, JSON.stringify(orderCart));
}

/* BUTTONS */

function initializeOrderButtons_() {
    const clearSignatureBtn = document.getElementById("clearSignatureBtn");
    const orderForm = document.getElementById("orderForm");

    if (clearSignatureBtn) {
        clearSignatureBtn.addEventListener("click", clearSignature_);
    }

    if (orderForm) {
        orderForm.addEventListener("submit", submitStoreOrder_);
    }
}

/* SUBMIT WITH REVIEW */

async function submitStoreOrder_(e) {
    e.preventDefault();

    if (!orderCart.length) {
        alert("Cart is empty.");
        return;
    }

    const customerName = document.getElementById("customerName")?.value || "";
    const contactNumber = document.getElementById("contactNumber")?.value || "";
    const paymentStatus = document.getElementById("paymentStatus")?.value || "Unpaid";
    const orderNotes = document.getElementById("orderNotes")?.value || "";
    const totalAmount = Number(document.getElementById("totalAmount")?.value || 0);

    const reviewText =
        "Please review your order carefully.\n\n" +
        "Store / Customer: " + customerName + "\n" +
        "Contact: " + contactNumber + "\n" +
        "Payment Status: " + paymentStatus + "\n" +
        "Total Amount: ₱" + formatMoney_(totalAmount) + "\n\n" +
        "Ordered Products:\n" +
        orderCart.map(item =>
            "- " + item.name +
            " | Qty: " + item.quantity +
            " | Total: ₱" + formatMoney_(Number(item.quantity) * Number(item.price))
        ).join("\n") +
        "\n\nAfter submission, only Admin can edit or adjust this order.\n\nProceed and submit final order?";

    const confirmed = confirm(reviewText);

    if (!confirmed) {
        return;
    }

    const session = getCurrentStoreSession_();

    const payload = {
        action: "submitStoreOrder",
        storeId: session.CustomerID || "STORE001",
        customerName,
        contactNumber,
        orderType: "Wholesale",
        paymentStatus,
        orderNotes,
        totalAmount,

        signatureImage: signatureCanvas
            ? signatureCanvas.toDataURL("image/png")
            : "",

        items: orderCart.map(item => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: Number(item.quantity) * Number(item.price)
        }))
    };

    try {
        const response = await fetch(getApiUrl_(), {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Order failed.");
            return;
        }

        localStorage.removeItem(STORE_CART_KEY);

        showSimpleInvoice_(result, payload);

        orderCart = [];
        renderOrderCart_();
        loadRecentOrders_();

    } catch (error) {
        console.error(error);
        alert("Connection error.");
    }
}

/* INVOICE */

function showSimpleInvoice_(result, payload) {
    const modal = document.getElementById("invoiceModal");

    if (!modal) return;

    setText_("invoiceIdText", result.invoiceId || "-");
    setText_("invoiceCustomerText", payload.customerName || "-");
    setText_("invoiceContactText", payload.contactNumber || "-");
    setText_("invoiceOrderTypeText", payload.orderType || "Wholesale");
    setText_("invoicePaymentStatusText", payload.paymentStatus || "Unpaid");
    setText_("invoiceDeliveryStatusText", "Pending");
    setText_("invoiceDateText", new Date().toLocaleString());
    setText_("invoiceNotesText", payload.orderNotes || "-");
    setText_("invoiceTotalText", "₱" + formatMoney_(payload.totalAmount || 0));

    const signatureImage = document.getElementById("invoiceSignatureImage");

    if (signatureImage) {
        signatureImage.src = payload.signatureImage || "";
    }

    renderInvoiceItems_(payload.items || []);

    modal.style.display = "flex";
    modal.style.visibility = "visible";
    modal.style.opacity = "1";
}

function renderInvoiceItems_(items) {
    const tbody = document.getElementById("invoiceItemsBody");

    if (!tbody) return;

    if (!items.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">No items found.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const qty = Number(item.quantity || 1);
        const price = Number(item.price || 0);
        const subtotal = qty * price;

        return `
            <tr>
                <td>${escapeHTML_(item.productName || "-")}</td>
                <td>${qty}</td>
                <td>₱${formatMoney_(price)}</td>
                <td>₱${formatMoney_(subtotal)}</td>
            </tr>
        `;
    }).join("");
}

function closeSimpleInvoice_() {
    const modal = document.getElementById("invoiceModal");

    if (modal) {
        modal.style.display = "none";
        modal.style.visibility = "hidden";
        modal.style.opacity = "0";
    }
}

/* RECENT ORDERS */

async function loadRecentOrders_() {
    const tbody = document.getElementById("ordersTableBody");

    if (!tbody) return;

    const session = getCurrentStoreSession_();

    try {
        const response = await fetch(getApiUrl_(), {
            method: "POST",
            body: JSON.stringify({
                action: "getStoreOrders",
                storeId: session.CustomerID || ""
            })
        });

        const result = await response.json();

        if (!result.success) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">Failed to load orders.</td>
                </tr>
            `;
            return;
        }

        const rows = result.rows || [];

        if (!rows.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">No orders found.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = rows.map(order => `
            <tr>
                <td>${order.InvoiceID || "-"}</td>
                <td>${order.CustomerName || "-"}</td>
                <td>${order.OrderType || "Wholesale"}</td>
                <td>₱${formatMoney_(order.TotalAmount || 0)}</td>
                <td>${order.PaymentStatus || "Unpaid"}</td>
                <td>${order.DeliveryStatus || "Pending"}</td>
                <td>
                    <button type="button" class="save-btn" onclick="window.print()">
                        Print
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (error) {
        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="7">Connection error.</td>
            </tr>
        `;
    }
}

/* SIGNATURE PAD */

function initializeSignaturePad_() {
    signatureCanvas = document.getElementById("signatureCanvas");

    if (!signatureCanvas) return;

    signatureCtx = signatureCanvas.getContext("2d");

    signatureCtx.strokeStyle = "#111827";
    signatureCtx.lineWidth = 2;

    signatureCanvas.addEventListener("mousedown", startSignature_);
    signatureCanvas.addEventListener("mousemove", moveSignature_);
    window.addEventListener("mouseup", endSignature_);

    signatureCanvas.addEventListener("touchstart", startSignatureTouch_);
    signatureCanvas.addEventListener("touchmove", moveSignatureTouch_);
    window.addEventListener("touchend", endSignature_);
}

function startSignature_(e) {
    isSigning = true;
    signatureCtx.beginPath();
    signatureCtx.moveTo(e.offsetX, e.offsetY);
}

function moveSignature_(e) {
    if (!isSigning) return;

    signatureCtx.lineTo(e.offsetX, e.offsetY);
    signatureCtx.stroke();
}

function startSignatureTouch_(e) {
    e.preventDefault();

    const rect = signatureCanvas.getBoundingClientRect();
    const touch = e.touches[0];

    startSignature_({
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
    });
}

function moveSignatureTouch_(e) {
    e.preventDefault();

    const rect = signatureCanvas.getBoundingClientRect();
    const touch = e.touches[0];

    moveSignature_({
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
    });
}

function endSignature_() {
    isSigning = false;
}

function clearSignature_() {
    if (!signatureCanvas || !signatureCtx) return;

    signatureCtx.clearRect(
        0,
        0,
        signatureCanvas.width,
        signatureCanvas.height
    );
}

/* HELPERS */

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

function escapeHTML_(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* GLOBALS */

window.changeOrderQty_ = changeOrderQty_;
window.removeOrderItem_ = removeOrderItem_;
window.closeSimpleInvoice_ = closeSimpleInvoice_;