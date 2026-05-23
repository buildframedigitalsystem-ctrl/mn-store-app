/* =========================================
   STORE PAYMENTS MODULE
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    requireSessionSafe_();

    loadStorePayments_();

});

/* =========================================
   LOAD PAYMENTS
========================================= */

async function loadStorePayments_() {

    const session =
        getCurrentStoreSession_();

    const tbody =
        document.getElementById("paymentsTableBody");

    if (!tbody) return;

    try {

        const response =
            await fetch(API.BASE_URL, {

                method: "POST",

                body: JSON.stringify({
                    action: "getStorePayments",
                    customerId: session.CustomerID
                })

            });

        const result =
            await response.json();

        if (!result.success) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        Failed to load payments.
                    </td>
                </tr>
            `;

            return;
        }

        const rows =
            result.rows || [];

        renderPayments_(rows);

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
   RENDER PAYMENTS
========================================= */

function renderPayments_(rows) {

    const tbody =
        document.getElementById("paymentsTableBody");

    if (!tbody) return;

    if (!rows.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    No payment records yet.
                </td>
            </tr>
        `;

        updatePaymentSummary_(0, 0, 0);

        return;
    }

    let totalPaid = 0;
    let totalPending = 0;

    tbody.innerHTML =
        rows.map(payment => {

            const amount =
                Number(payment.AmountPaid || 0);

            const status =
                String(payment.PaymentStatus || "");

            totalPaid += amount;

            if (
                status !== "CONFIRMED"
            ) {
                totalPending += amount;
            }

            return `
                <tr>

                    <td>
                        ${formatDate_(payment.CreatedAt)}
                    </td>

                    <td>
                        ${payment.InvoiceID || "-"}
                    </td>

                    <td>
                        ₱${formatMoney_(amount)}
                    </td>

                    <td>
                        ${payment.PaymentMethod || "-"}
                    </td>

                    <td>
                        ${payment.PaymentStatus || "PENDING"}
                    </td>

                    <td>

                        ${payment.ProofLink
                    ? `
                                    <a
                                        href="${payment.ProofLink}"
                                        target="_blank"
                                        class="store-primary-btn"
                                    >
                                        View Proof
                                    </a>
                                `
                    : "-"
                }

                    </td>

                </tr>
            `;

        }).join("");

    const balance =
        Math.max(
            0,
            totalPending
        );

    updatePaymentSummary_(
        totalPaid,
        totalPending,
        balance
    );
}

/* =========================================
   SUMMARY CARDS
========================================= */

function updatePaymentSummary_(
    totalPaid,
    totalPending,
    balance
) {

    setText_(
        "outstandingBalanceText",
        "₱" + formatMoney_(balance)
    );

    setText_(
        "totalPaidText",
        "₱" + formatMoney_(totalPaid)
    );

    setText_(
        "pendingInvoicesText",
        "₱" + formatMoney_(totalPending)
    );
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
        .toLocaleString("en-PH", {

            minimumFractionDigits: 2,
            maximumFractionDigits: 2

        });
}

function formatDate_(value) {

    if (!value) return "-";

    return new Date(value)
        .toLocaleDateString("en-PH", {

            year: "numeric",
            month: "short",
            day: "numeric"

        });
}