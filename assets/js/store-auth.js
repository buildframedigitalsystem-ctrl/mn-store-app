/* =========================================
   STORE SIGNUP
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeStoreSignup_();

});

function initializeStoreSignup_() {

    const form =
        document.getElementById(
            "storeSignupForm"
        );

    if (!form) return;

    form.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            const storeName =
                document.getElementById("storeName").value.trim();

            const ownerName =
                document.getElementById("ownerName").value.trim();

            const contactNumber =
                document.getElementById("contactNumber").value.trim();

            const address =
                document.getElementById("address").value.trim();

            const email =
                document.getElementById("email").value.trim();

            const username =
                document.getElementById("username").value.trim();

            const password =
                document.getElementById("password").value.trim();

            if (
                !storeName ||
                !ownerName ||
                !contactNumber ||
                !address
            ) {
                alert(
                    "Please complete all required fields."
                );

                return;
            }

            try {

                const payload = {
                    action: "addCustomer",

                    StoreName: storeName,
                    OwnerName: ownerName,
                    ContactNumber: contactNumber,
                    Address: address,

                    Email: email,

                    Username: username,
                    Password: password,

                    CustomerType: "WHOLESALE",

                    AccountStatus: "PENDING",

                    StoreAppAccess: "NO"
                };

                const response =
                    await fetch(
                        API.BASE_URL,
                        {
                            method: "POST",
                            body: JSON.stringify(payload)
                        }
                    );

                const data =
                    await response.json();

                if (data.success) {

                    alert(
                        "Store registration submitted successfully. Please wait for admin approval."
                    );

                    window.location.href =
                        "store-login.html";

                } else {

                    alert(
                        data.message ||
                        "Registration failed."
                    );

                }

            } catch (error) {

                console.error(error);

                alert(
                    "Server connection failed."
                );

            }

        }
    );

}

/* =========================================
   STORE LOGIN
========================================= */

function initializeStoreLogin_() {

    const form =
        document.getElementById(
            "storeLoginForm"
        );

    if (!form) return;

    form.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            const username =
                document.getElementById(
                    "loginUsername"
                ).value.trim();

            const password =
                document.getElementById(
                    "loginPassword"
                ).value.trim();

            if (!username || !password) {

                alert(
                    "Please complete login fields."
                );

                return;
            }

            try {

                const payload = {
                    action: "storeLogin",

                    Username: username,
                    Password: password
                };

                const response =
                    await fetch(
                        API.BASE_URL,
                        {
                            method: "POST",
                            body: JSON.stringify(payload)
                        }
                    );

                const data =
                    await response.json();

                if (data.success) {

                    localStorage.setItem(
                        "mnStoreSession",
                        JSON.stringify(data.customer)
                    );

                    alert(
                        "Login successful."
                    );

                    window.location.href =
                        "index.html";

                } else {

                    alert(
                        data.message ||
                        "Login failed."
                    );

                }

            } catch (error) {

                console.error(error);

                alert(
                    "Server connection failed."
                );

            }

        }
    );

}

/* =========================================
   INIT LOGIN
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeStoreLogin_();

    }
);