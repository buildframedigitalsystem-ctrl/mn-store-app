/* =========================================
   M&N STORE ORDERS MODULE
   BuildFrame Store OS
========================================= */

let storeProducts = [];
let orderCart = [];

let signatureCanvas = null;
let signatureCtx = null;
let isSigning = false;

/* =========================================
   START
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeSignaturePad_();
    initializeOrderButtons_();

    loadStoreProducts_();
    loadRecentOrders_();

});

/* =========================================
   API URL
========================================= */

function getApiUrl_() {

    if (
        typeof API !== "undefined" &&
        API.BASE_URL
    ) {
        return API.BASE_URL;
    }

    return "YOUR_APPS_SCRIPT_WEBAPP_URL";

}

/* =========================================
   LOAD PRODUCTS
========================================= */

async function loadStoreProducts_() {

    const productSelect =
        document.getElementById("productSelect");

    if (!productSelect) return;

    try {

        productSelect.innerHTML = `
            <option value="">
                Loading products...
            </option>
        `;

        const response =
            await fetch(getApiUrl_(), {
                method: "POST",
                body: JSON.stringify({
                    action: "getWholesaleProducts"
                })
            });

        const data =
            await response.json();

        const rows =
            data.rows ||
            data.products ||
            [];

        storeProducts =
            Array.isArray(rows)
                ? rows
                : [];

        if (!storeProducts.length) {

            productSelect.innerHTML = `
                <option value="">
                    No products found
                </option>
            `;

            return;
        }

        productSelect.innerHTML = `
            <option value="">
                Select Product
            </option>

            ${storeProducts.map((product, index) => {

            const name =
                product.ProductName ||
                "Unnamed Product";

            const price =
                Number(
                    product.WholesalePrice ||
                    product.SellingPrice ||
                    0
                );

            return `
                    <option value="${index}">
                        ${escapeHTML_(name)}
                        - ₱${formatMoney_(price)}
                    </option>
                `;

        }).join("")}
        `;

    } catch (error) {

        console.error(error);

        productSelect.innerHTML = `
            <option value="">
                Failed loading products
            </option>
        `;

    }

}

/* =========================================
   BUTTONS
========================================= */

function initializeOrderButtons_() {

    const addToCartBtn =
        document.getElementById("addToCartBtn");

    const clearSignatureBtn =
        document.getElementById("clearSignatureBtn");

    const orderForm =
        document.getElementById("orderForm");

    if (addToCartBtn) {
        addToCartBtn.addEventListener(
            "click",
            addSelectedProductToCart_
        );
    }

    if (clearSignatureBtn) {
        clearSignatureBtn.addEventListener(
            "click",
            clearSignature_
        );
    }

    if (orderForm) {
        orderForm.addEventListener(
            "submit",
            submitStoreOrder_
        );
    }

}

/* =========================================
   ADD PRODUCT TO CART
========================================= */

function addSelectedProductToCart_() {

    const productSelect =
        document.getElementById("productSelect");

    const quantityInput =
        document.getElementById("productQuantity");

    if (!productSelect || !quantityInput) return;

    const productIndex =
        productSelect.value;

    const quantity =
        Number(quantityInput.value || 1);

    if (productIndex === "") {

        alert("Please select product.");

        return;
    }

    if (quantity <= 0) {

        alert("Invalid quantity.");

        return;
    }

    const product =
        storeProducts[productIndex];

    if (!product) {

        alert("Product not found.");

        return;
    }

    const productId =
        product.ProductID ||
        product.ID ||
        product.ProductName;

    const name =
        product.ProductName ||
        "Unnamed Product";

    const price =
        Number(
            product.WholesalePrice ||
            product.SellingPrice ||
            0
        );

    const existing =
        orderCart.find(item =>
            String(item.productId) ===
            String(productId)
        );

    if (existing) {

        existing.quantity += quantity;

        existing.total =
            existing.quantity *
            existing.price;

    } else {

        orderCart.push({
            productId,
            name,
            quantity,
            price,
            total: quantity * price
        });

    }

    productSelect.value = "";
    quantityInput.value = 1;

    renderOrderCart_();

}

/* =========================================
   RENDER CART
========================================= */

function renderOrderCart_() {

    const cartTableBody =
        document.getElementById("cartTableBody");

    const totalAmountInput =
        document.getElementById("totalAmount");

    if (!cartTableBody) return;

    if (!orderCart.length) {

        cartTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    No products added.
                </td>
            </tr>
        `;

        if (totalAmountInput) {
            totalAmountInput.value = 0;
        }

        return;
    }

    cartTableBody.innerHTML =
        orderCart.map((item, index) => `

            <tr>

                <td>
                    ${escapeHTML_(item.name)}
                </td>

                <td>
                    ${item.quantity}
                </td>

                <td>
                    ₱${formatMoney_(item.price)}
                </td>

                <td>
                    ₱${formatMoney_(item.total)}
                </td>

                <td>
                    <button
                        type="button"
                        onclick="removeCartItem_(${index})">

                        Remove

                    </button>
                </td>

            </tr>

        `).join("");

    const total =
        orderCart.reduce(
            (sum, item) =>
                sum + item.total,
            0
        );

    if (totalAmountInput) {
        totalAmountInput.value = total;
    }

}

/* =========================================
   REMOVE CART ITEM
========================================= */

function removeCartItem_(index) {

    orderCart.splice(index, 1);

    renderOrderCart_();

}

/* =========================================
   SIGNATURE PAD
========================================= */

function initializeSignaturePad_() {

    signatureCanvas =
        document.getElementById(
            "signatureCanvas"
        );

    if (!signatureCanvas) return;

    signatureCtx =
        signatureCanvas.getContext("2d");

    resizeSignatureCanvas_();

    signatureCtx.lineWidth = 3;
    signatureCtx.strokeStyle = "#062f1b";
    signatureCtx.lineCap = "round";

    signatureCanvas.style.touchAction = "none";

    signatureCanvas.addEventListener(
        "mousedown",
        startSignature_
    );

    signatureCanvas.addEventListener(
        "mousemove",
        drawSignature_
    );

    signatureCanvas.addEventListener(
        "mouseup",
        stopSignature_
    );

    signatureCanvas.addEventListener(
        "mouseleave",
        stopSignature_
    );

    signatureCanvas.addEventListener(
        "touchstart",
        startSignature_,
        { passive: false }
    );

    signatureCanvas.addEventListener(
        "touchmove",
        drawSignature_,
        { passive: false }
    );

    signatureCanvas.addEventListener(
        "touchend",
        stopSignature_
    );

}

/* =========================================
   SIGNATURE HELPERS
========================================= */

function getSignaturePosition_(event) {

    const rect =
        signatureCanvas.getBoundingClientRect();

    if (
        event.touches &&
        event.touches.length
    ) {

        return {
            x:
                event.touches[0].clientX -
                rect.left,

            y:
                event.touches[0].clientY -
                rect.top
        };

    }

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

}

function startSignature_(event) {

    event.preventDefault();

    isSigning = true;

    const position =
        getSignaturePosition_(event);

    signatureCtx.beginPath();

    signatureCtx.moveTo(
        position.x,
        position.y
    );

}

function drawSignature_(event) {

    if (!isSigning) return;

    event.preventDefault();

    const position =
        getSignaturePosition_(event);

    signatureCtx.lineTo(
        position.x,
        position.y
    );

    signatureCtx.stroke();

}

function stopSignature_() {

    isSigning = false;

}

function clearSignature_() {

    if (!signatureCanvas) return;

    signatureCtx.clearRect(
        0,
        0,
        signatureCanvas.width,
        signatureCanvas.height
    );

}

function resizeSignatureCanvas_() {

    if (!signatureCanvas) return;

    const rect =
        signatureCanvas.getBoundingClientRect();

    signatureCanvas.width = rect.width;
    signatureCanvas.height = rect.height;

}

/* =========================================
   SUBMIT ORDER
========================================= */

async function submitStoreOrder_(event) {

    event.preventDefault();

    if (!orderCart.length) {

        alert(
            "Please add product first."
        );

        return;
    }

    const submitBtn =
        document.getElementById(
            "submitOrderBtn"
        );

    if (submitBtn) {

        submitBtn.disabled = true;
        submitBtn.innerText =
            "Submitting...";

    }

    const payload = {

        action: "submitStoreOrder",

        storeId: "STORE001",

        customerName:
            document.getElementById(
                "customerName"
            )?.value || "",

        contactNumber:
            document.getElementById(
                "contactNumber"
            )?.value || "",

        orderType: "Wholesale",

        paymentStatus:
            document.getElementById(
                "paymentStatus"
            )?.value || "Unpaid",

        orderNotes:
            document.getElementById(
                "orderNotes"
            )?.value || "",

        totalAmount:
            Number(
                document.getElementById(
                    "totalAmount"
                )?.value || 0
            ),

        signatureImage:
            signatureCanvas
                ? signatureCanvas.toDataURL(
                    "image/png"
                )
                : "",

        items: orderCart

    };

    try {

        const response =
            await fetch(getApiUrl_(), {
                method: "POST",
                body: JSON.stringify(payload)
            });

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                data.message ||
                "Submit failed."
            );

        }

        alert(
            "Order submitted successfully."
        );

        orderCart = [];

        renderOrderCart_();

        clearSignature_();

        document.getElementById(
            "orderForm"
        )?.reset();

        loadRecentOrders_();

    } catch (error) {

        console.error(error);

        alert(
            "Failed submitting order."
        );

    } finally {

        if (submitBtn) {

            submitBtn.disabled = false;

            submitBtn.innerText =
                "Submit Order";

        }

    }

}

/* =========================================
   LOAD RECENT ORDERS
========================================= */

async function loadRecentOrders_() {

    const tbody =
        document.getElementById(
            "ordersTableBody"
        );

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="7">
                Loading orders...
            </td>
        </tr>
    `;

    try {

        const response =
            await fetch(getApiUrl_(), {
                method: "POST",
                body: JSON.stringify({
                    action: "getStoreOrders"
                })
            });

        const result =
            await response.json();

        if (!result.success) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        Failed loading orders.
                    </td>
                </tr>
            `;

            return;
        }

        const orders =
            result.rows || [];

        if (!orders.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        No orders yet.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            orders.map(order => `

                <tr>

                    <td>
                        ${order.OrderID || "-"}
                    </td>

                    <td>
                        ${order.CustomerName || "-"}
                    </td>

                    <td>
                        ${order.OrderType || "-"}
                    </td>

                    <td>
                        ₱${formatMoney_(
                order.TotalAmount
            )}
                    </td>

                    <td>
                        ${order.PaymentStatus || "-"}
                    </td>

                    <td>
                        ${order.DeliveryStatus || "-"}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="viewInvoice_('${order.InvoiceID || order.OrderID || ""}')">

                            View Invoice

                        </button>

                    </td>

                </tr>

            `).join("");

    } catch (error) {

        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    Backend connection failed.
                </td>
            </tr>
        `;

    }

}

/* =========================================
   VIEW INVOICE
========================================= */

function viewInvoice_(invoiceId) {

    const row =
        document
            .querySelector(`button[onclick="viewInvoice_('${invoiceId}')"]`)
            ?.closest("tr");

    if (!row) {
        alert("Invoice row not found.");
        return;
    }

    const cells =
        row.querySelectorAll("td");

    const invoiceWindow =
        window.open("", "_blank");

    invoiceWindow.document.write(`
        <html>
            <head>
                <title>${invoiceId}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 40px;
                        color: #0f172a;
                    }

                    .invoice-box {
                        max-width: 800px;
                        margin: auto;
                        border: 1px solid #e2e8f0;
                        border-radius: 18px;
                        padding: 32px;
                    }

                    h1 {
                        color: #005f2f;
                        margin-bottom: 4px;
                    }

                    .line {
                        margin: 12px 0;
                    }

                    strong {
                        display: inline-block;
                        width: 160px;
                    }

                    .total {
                        font-size: 28px;
                        font-weight: 900;
                        color: #005f2f;
                        margin-top: 24px;
                    }

                    button {
                        margin-top: 30px;
                        padding: 12px 22px;
                        border: none;
                        border-radius: 10px;
                        background: #005f2f;
                        color: white;
                        font-weight: 800;
                        cursor: pointer;
                    }
                </style>
            </head>

            <body>
                <div class="invoice-box">
                    <h1>M&N Consumer Goods</h1>
                    <p>Wholesale Invoice</p>

                    <div class="line"><strong>Invoice ID:</strong> ${invoiceId}</div>
                    <div class="line"><strong>Order ID:</strong> ${cells[0]?.innerText || "-"}</div>
                    <div class="line"><strong>Customer:</strong> ${cells[1]?.innerText || "-"}</div>
                    <div class="line"><strong>Order Type:</strong> ${cells[2]?.innerText || "-"}</div>
                    <div class="line"><strong>Payment:</strong> ${cells[4]?.innerText || "-"}</div>
                    <div class="line"><strong>Status:</strong> ${cells[5]?.innerText || "-"}</div>
                    
                    <div class="line">
                      <strong>Date & Time:</strong>

                       ${new Date().toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    })}
                    </div>

                    <div class="total">
                        Total: ${cells[3]?.innerText || "₱0.00"}
                    </div>

                    <button onclick="window.print()">Print Invoice</button>
                </div>
            </body>
        </html>
    `);

    invoiceWindow.document.close();
}

/* =========================================
   HELPERS
========================================= */

function formatMoney_(value) {

    return Number(
        value || 0
    ).toLocaleString("en-PH", {
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