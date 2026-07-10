import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

/* ==========================
   ELEMENTS
========================== */

const greeting =
document.getElementById("account-greeting");

const accountMenu =
document.getElementById("account-menu");

/* ==========================
   ACCOUNT DROPDOWN
========================== */

onAuthStateChanged(auth, (user) => {

    if (!greeting || !accountMenu) return;

    /* ======================
       USER LOGGED IN
    ====================== */

    if (user) {

        const firstName =
        (user.displayName || "Customer")
        .split(" ")[0];

        greeting.textContent =
        `Hi, ${firstName}`;

        accountMenu.innerHTML = `

            <a href="account.html">

                <i class="fas fa-user"></i>

                My Account

            </a>

            <a href="account.html?section=orders">

                <i class="fas fa-box"></i>

                My Orders

            </a>

            <a href="wishlist.html">

                <i class="fas fa-heart"></i>

                Wishlist

            </a>

            <hr>

            <a href="#"
               id="logout-link"
               class="logout-link">

                <i class="fas fa-right-from-bracket"></i>

                Logout

            </a>

        `;

        document
        .getElementById("logout-link")
        .addEventListener("click", (e) => {

            e.preventDefault();

            signOut(auth).then(() => {

                window.location.href =
                "index.html";

            });

        });

    }

    /* ======================
       USER NOT LOGGED IN
    ====================== */

    else {

        greeting.textContent =
        "Account";

        accountMenu.innerHTML = `

            <a href="login.html">

                <i class="fas fa-right-to-bracket"></i>

                Login

            </a>

            <a href="signup.html">

                <i class="fas fa-user-plus"></i>

                Create Account

            </a>

        `;

    }

});