/* =========================================
   STORE RETURNS MODULE
   BuildFrame Store OS
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "Store Returns Module Loaded"
        );

        initializeStoreReturns_();

    }
);

/* =========================================
   INITIALIZE
========================================= */

function initializeStoreReturns_() {

    const form =
        document.getElementById(
            "returnRequestForm"
        );

    if (form) {

        form.addEventListener(
            "submit",
            submitReturnRequest_
        );
    }
}

/* =========================================
   SUBMIT RETURN REQUEST
========================================= */

async function submitReturnRequest_(e) {

    e.preventDefault();

    try {

        const user =
            JSON.parse(
                localStorage.getItem("mnUser") || "{}"
            );

        const customerId =
            user.CustomerID || "";

        const storeName =
            user.StoreName || "";

        const invoiceId =
            document.getElementById(
                "returnInvoiceId"
            ).value.trim();

        const reason =
            document.getElementById(
                "returnReason"
            ).value.trim();

        const details =
            document.getElementById(
                "returnDetails"
            ).value.trim();

        if (
            !invoiceId ||
            !reason ||
            !details
        ) {

            alert(
                "Please complete all required fields."
            );

            return;
        }

        const confirmed =
            confirm(
                "Submit this return/concern request to M&N Admin?"
            );

        if (!confirmed) {
            return;
        }

        const payload = {

            action:
                "submitCustomerReturn",

            customerId:
                customerId,

            storeName:
                storeName,

            invoiceId:
                invoiceId,

            reason:
                reason,

            details:
                details

        };

        const response =
            await fetch(API.BASE_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            });

        const result =
            await response.json();

        if (!result.success) {

            alert(
                result.message ||
                "Return request failed."
            );

            return;
        }

        alert(
            "Return request submitted successfully. M&N Admin will review your concern."
        );

        document.getElementById(
            "returnRequestForm"
        ).reset();

    } catch (error) {

        console.error(error);

        alert(
            "Connection error."
        );
    }
}