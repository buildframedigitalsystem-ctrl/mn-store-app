/* =========================================
   STORE PAYMENTS MODULE
   BuildFrame Store OS
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "Store Payments Module Loaded"
        );

        initializeStorePayments_();

    }
);

/* =========================================
   INITIALIZE
========================================= */

async function initializeStorePayments_() {

    try {

        const user =
            JSON.parse(
                localStorage.getItem("mnUser") || "{}"
            );

        const customerId =
            user.CustomerID || "";

        if (!customerId) {
            console.warn("Customer ID missing.");
            return;
        }

        const response =
            await fetch(API.BASE_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "getStorePartnerSummary",
                    customerId: customerId
                })
            });

        const result =
            await response.json();

        if (!result.success) {

            console.error(result.message);

            return;
        }

        const summary =
            result.summary || {};

        /* =========================================
           ACCOUNT CARD
        ========================================= */

        setText_(
            "paymentStoreName",
            summary.storeName ||
            "M&N Partner Store"
        );

        setText_(
            "paymentAccountType",
            "Account Type: " +
            (
                summary.storeType ||
                "Wholesale Store"
            )
        );

        setText_(
            "paymentStatusText",
            "Payment Status: Monitoring"
        );

        setText_(
            "paymentBalanceText",
            "Outstanding Balance: ₱" +
            formatMoney_(
                summary.outstandingBalance || 0
            )
        );

        /* =========================================
           DASHBOARD CARDS
        ========================================= */

        setText_(
            "outstandingBalanceText",
            "₱" +
            formatMoney_(
                summary.outstandingBalance || 0
            ) +
            " currently recorded."
        );

        setText_(
            "totalPaidText",
            "₱" +
            formatMoney_(
                summary.totalPaid || 0
            ) +
            " payment history recorded."
        );

        setText_(
            "pendingInvoicesText",
            (
                summary.pendingDeliveries || 0
            ) +
            " pending invoices/orders."
        );

        /* =========================================
           LOAD PAYMENT RECORDS
        ========================================= */

        loadPaymentRecords_(customerId);

    } catch (error) {

        console.error(error);

    }
}

/* =========================================
   LOAD PAYMENT RECORDS
========================================= */

async function loadPaymentRecords_(customerId) {

    const tbody =
        document.getElementById(
            "paymentsTableBody"
        );

    if (!tbody) return;

    try {

        const response =
            await fetch(API.BASE_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "getStoreOrders",
                    storeId: customerId
                })
            });

        const result =
            await response.json();

        if (!result.success) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        Failed to load payment records.
                    </td>
                </tr>
            `;

            return;
        }

        const rows =
            result.rows || [];

        if (!rows.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No payment records yet.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            rows.map(order => {

                const status =
                    order.PaymentStatus || "Unpaid";

                return `
                    <tr>

                        <td>
                            ${formatDate_(
                    order.OrderDate
                )}
                        </td>

                        <td>
                            ${order.InvoiceID || "-"}
                        </td>

                        <td>
                            ${order.PaymentMethod ||
                    "COD / Manual"
                    }
                        </td>

                        <td>
                            ₱${formatMoney_(
                        order.TotalAmount || 0
                    )}
                        </td>

                        <td>
                            <span class="payment-status-badge">
                                ${status}
                            </span>
                        </td>

                        <td>
                            ${order.PaymentNotes ||
                    "Awaiting admin confirmation."
                    }
                        </td>

                    </tr>
                `;
            }).join("");

    } catch (error) {

        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    Connection error.
                </td>
            </tr>
        `;
    }
}

/* =========================================
   HELPERS
========================================= */

function setText_(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.innerText = value;
    }
}

function formatMoney_(value) {

    return Number(value || 0)
        .toLocaleString(
            "en-PH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}

function formatDate_(value) {

    if (!value) return "-";

    try {

        return new Date(value)
            .toLocaleDateString(
                "en-PH",
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            );

    } catch (error) {

        return "-";
    }
}