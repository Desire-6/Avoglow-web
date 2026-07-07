import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

/* ======================================================
GLOBALS
====================================================== */

let currentUser = null;

/* ======================================================
NAVIGATION ELEMENTS
====================================================== */

const greeting = document.getElementById("account-greeting");
const accountMenu = document.getElementById("account-menu");

/* ======================================================
ACCOUNT PAGE ELEMENTS
====================================================== */

const userName = document.getElementById("user-name");
const userEmail = document.getElementById("user-email");

const welcomeName = document.getElementById("welcome-name");

const detailName = document.getElementById("detail-name");
const detailEmail = document.getElementById("detail-email");

const savedAddress = document.getElementById("saved-address");
const addAddressBtn = document.getElementById("add-address-btn");

/* ======================================================
SIDEBAR NAVIGATION
====================================================== */

const sidebarLinks =
document.querySelectorAll(".account-sidebar nav a[data-section]");

const sections =
document.querySelectorAll(".account-section");

/* ======================================================
SECTION SWITCHER
====================================================== */

function openSection(sectionId){

    sections.forEach(section=>{

        section.style.display="none";

    });

    sidebarLinks.forEach(link=>{

        link.classList.remove("active");

    });

    const activeSection =
    document.getElementById(sectionId);

    if(activeSection){

        activeSection.style.display="block";

    }

    const activeLink =
    document.querySelector(

        `.account-sidebar nav a[data-section="${sectionId}"]`

    );

    if(activeLink){

        activeLink.classList.add("active");

    }

}

/* ======================================================
SIDEBAR EVENTS
====================================================== */

sidebarLinks.forEach(link=>{

    link.addEventListener("click",(e)=>{

        e.preventDefault();

        openSection(link.dataset.section);

    });

});

/* ======================================================
LOGOUT
====================================================== */

function logoutUser(e){

    if(e){

        e.preventDefault();

    }

    signOut(auth)

    .then(()=>{

        localStorage.removeItem("loggedIn");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("redirectAfterLogin");

        window.location.href="index.html";

    })

    .catch(err=>{

        console.error(err);

    });

}

const logoutBtn =
document.getElementById("logout-btn");

if(logoutBtn){

    logoutBtn.addEventListener("click",logoutUser);

}

/* ======================================================
AUTH STATE
====================================================== */

onAuthStateChanged(auth,async(user)=>{

    if(!user){

        if(window.location.pathname.includes("account.html")){

            window.location.href="login.html";

        }

        return;

    }

    currentUser=user;

    const fullName=
    user.displayName || "Avoglow Customer";

    const firstName=
    fullName.split(" ")[0];

    /* ---------- NAV ---------- */

    if(greeting){

        greeting.textContent=`Hi, ${firstName}`;

    }

    if(accountMenu){

        accountMenu.innerHTML=`

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

        <a href="#" id="logout-link">
            <i class="fas fa-right-from-bracket"></i>
            Logout
        </a>

        `;

        document
        .getElementById("logout-link")
        .addEventListener("click",logoutUser);

    }

    /* ---------- DASHBOARD ---------- */

    if(userName) userName.textContent=fullName;
    if(userEmail) userEmail.textContent=user.email;

    if(detailName) detailName.textContent=fullName;
    if(detailEmail) detailEmail.textContent=user.email;

    if(welcomeName) welcomeName.textContent=firstName;

    /* ---------- LOAD DATA ---------- */

   await loadSavedAddress(user);

    loadRecentlyViewed();

    openSection("dashboard");

});
/* ==========================
   RECENTLY VIEWED
========================== */

function loadRecentlyViewed(){

    const section =
        document.getElementById("recent-section");

    const container =
        document.getElementById("recently-viewed-container");

    if(!container || !section) return;

    const viewed =
        JSON.parse(localStorage.getItem("recentlyViewed")) || [];

    container.innerHTML = "";

    if(viewed.length === 0){

        section.style.display = "none";

        return;

    }

    section.style.display = "block";

    viewed.forEach(product=>{

        container.innerHTML += `

        <div class="recent-card">

            <a href="${product.link}">

                <img src="${product.image}" alt="${product.name}">

            </a>

            <div class="recent-content">

                <h3>${product.name}</h3>

                <p class="recent-category">${product.category}</p>

                <div class="recent-price">

                    UGX ${Number(product.price).toLocaleString()}

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
    document.getElementById("recently-viewed-container");

const leftArrow =
    document.querySelector(".recent-arrow.left");

const rightArrow =
    document.querySelector(".recent-arrow.right");

if (recentContainer && leftArrow && rightArrow) {

    rightArrow.addEventListener("click", () => {

        recentContainer.scrollBy({

            left: 350,

            behavior: "smooth"

        });

    });

    leftArrow.addEventListener("click", () => {

        recentContainer.scrollBy({

            left: -350,

            behavior: "smooth"

        });

    });

}
/* ==========================
   LOAD SAVED ADDRESS
========================== */

async function loadSavedAddress(user){

    const addressCard =
        document.getElementById("saved-address");

    const addBtn =
        document.getElementById("add-address-btn");

    if(!addressCard) return;

    try{

        const ref = doc(
            db,
            "users",
            user.uid,
            "profile",
            "address"
        );

        const snap = await getDoc(ref);

        if(!snap.exists()){

            addressCard.innerHTML = `
                <p>No address saved yet.</p>
            `;

            if(addBtn){

                addBtn.textContent = "Add Address";

            }

            return;

        }

        const data = snap.data();

        addressCard.innerHTML = `
            <div class="saved-address-card">
                <h4>${data.fullName}</h4>
                <p>${data.address}</p>
                <p>${data.city}, ${data.district}</p>
                <p>${data.phone}</p>
            </div>
        `;

        if(addBtn){

            addBtn.textContent = "Manage Addresses";

        }

    }

    catch(error){

        console.error(error);

    }

}
/* ==========================
   ADDRESS BUTTON
========================== */

const addressButton =
document.getElementById("add-address-btn");

if(addressButton){

    addressButton.addEventListener("click",()=>{

        window.location.href="addresses-book.html";

    });

}
