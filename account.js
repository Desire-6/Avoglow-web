import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

/* ==========================
   NAV ELEMENTS
========================== */

const greeting = document.getElementById("account-greeting");
const accountMenu = document.getElementById("account-menu");

/* ==========================
   AUTH STATE
========================== */

onAuthStateChanged(auth, (user) => {

    if (user) {

        const fullName = user.displayName || "Avoglow Customer";
        const firstName = fullName.split(" ")[0];

        /* ==========================
           Update Navigation
        ========================== */

        if (greeting) {

            greeting.textContent = `Hi, ${firstName}`;

        }

        if (accountMenu) {

            accountMenu.innerHTML = `

                <a href="account.html">
                    <i class="fas fa-user"></i>
                    My Account
                </a>

                <a href="orders.html">
                    <i class="fas fa-box"></i>
                    My Orders
                </a>

                <a href="wishlist.html">
                    <i class="fas fa-heart"></i>
                    Wishlist
                </a>

                <a href="#" id="logout-link" class="logout-link">
                    <i class="fas fa-right-from-bracket"></i>
                    Logout
                </a>

            `;

            document
                .getElementById("logout-link")
                .addEventListener("click", logoutUser);

        }

        /* ==========================
           Account Page Details
        ========================== */

        const userName =
            document.getElementById("user-name");

        const userEmail =
            document.getElementById("user-email");

        const welcomeName =
            document.getElementById("welcome-name");

        const detailName =
            document.getElementById("detail-name");

        const detailEmail =
            document.getElementById("detail-email");

        if (userName)
            userName.textContent = fullName;

        if (userEmail)
            userEmail.textContent = user.email;

        if (welcomeName)
            welcomeName.textContent = firstName;

        if (detailName)
            detailName.textContent = fullName;

        if (detailEmail)
            detailEmail.textContent = user.email;

    }

    else {

        /* ==========================
           Guest Navigation
        ========================== */

        if (greeting) {

            greeting.textContent = "Account";

        }

        if (accountMenu) {

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

        /* ==========================
           Protect Account Page
        ========================== */

        if (window.location.pathname.includes("account.html")) {

            window.location.href = "login.html";

        }

    }

});

/* ==========================
   Sidebar Logout Button
========================== */

const sidebarLogout =
document.getElementById("logout-btn");

if (sidebarLogout) {

    sidebarLogout.addEventListener("click", logoutUser);

}

/* ==========================
   Logout Function
========================== */

function logoutUser(e) {

    if (e) {

        e.preventDefault();

    }

    signOut(auth)
        .then(() => {

            localStorage.removeItem("loggedIn");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("redirectAfterLogin");

            window.location.href = "index.html";

        })
        .catch((error) => {

            console.error("Logout failed:", error);

        });

}
/* ==========================
   RECENTLY VIEWED
========================== */

function loadRecentlyViewed(){

    const container =
    document.getElementById(
        "recently-viewed-container"
    );

    if(!container) return;

    const viewed =
    JSON.parse(
        localStorage.getItem(
            "recentlyViewed"
        )
    ) || [];

    container.innerHTML = "";

    if(viewed.length === 0){

        container.innerHTML = `
            <p style="padding:20px;text-align:center;">
                No recently viewed products yet.
            </p>
        `;

        return;

    }

    viewed.forEach(product => {

        container.innerHTML += `

        <div class="recent-card">

            <a href="${product.link}">

                <img src="${product.image}"
                     alt="${product.name}">

            </a>

            <div class="recent-content">

                <h3>${product.name}</h3>

                <p class="recent-category">

                    ${product.category}

                </p>

                <div class="recent-price">

                    UGX ${product.price.toLocaleString()}

                </div>

                <a href="${product.link}">

                    <button class="recent-btn">

                        View Product

                    </button>

                </a>

            </div>

        </div>

        `;

    });

}

loadRecentlyViewed();

/* ==========================
   RECENTLY VIEWED ARROWS
========================== */

const recentContainer =
document.getElementById(
    "recently-viewed-container"
);

const leftArrow =
document.querySelector(
    ".recent-arrow.left"
);

const rightArrow =
document.querySelector(
    ".recent-arrow.right"
);

if(recentContainer && leftArrow && rightArrow){

    rightArrow.addEventListener("click", () => {

        recentContainer.scrollBy({

            left:350,

            behavior:"smooth"

        });

    });

    leftArrow.addEventListener("click", () => {

        recentContainer.scrollBy({

            left:-350,

            behavior:"smooth"

        });

    });

}