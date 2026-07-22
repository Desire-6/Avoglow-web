// import { db } from "./firebase-config.js";

// import {
//     collection,
//     getDocs,
//     query,
//     orderBy
// } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// const productsGrid = document.getElementById("products-grid");

// // Cache settings
// const CACHE_KEY = "products";
// const CACHE_TIME_KEY = "productsCacheTime";

// // Cache for 24 hours
// const CACHE_DURATION = 24 * 60 * 60 * 1000;

// function displayProducts(products) {

//     let html = "";

//     products.forEach((product) => {

//         html += `

//         <div class="product-card ${product.filterCategory}">

//             <img
//                 src="${product.image}"
//                 alt="${product.name}"
//                 loading="lazy"
//                 decoding="async">

//             <h3>${product.name}</h3>

//             <p>${product.paragraph}</p>

//             <span class="price">
//                 UGX ${product.price.toLocaleString()}
//             </span>

//             <a
//                 href="product.html?slug=${product.slug}"
//                 class="product-btn">

//                 View Product

//             </a>

//         </div>

//         `;

//     });

//     productsGrid.innerHTML = html;

// }

// async function loadProducts() {

//     // Check if products are already cached

//     const cachedProducts = localStorage.getItem(CACHE_KEY);

//     const cacheTime = localStorage.getItem(CACHE_TIME_KEY);

//     if (cachedProducts && cacheTime) {

//         const age = Date.now() - Number(cacheTime);

//         if (age < CACHE_DURATION) {

//             console.log("Loaded products from localStorage");

//             displayProducts(JSON.parse(cachedProducts));

//             return;

//         }

//         console.log("Product cache expired.");

//     }

//     console.log("Loading products from Firestore...");

//     const productsQuery = query(
//         collection(db, "products"),
//         orderBy("displayOrder")
//     );

//     const querySnapshot = await getDocs(productsQuery);

//     const products = [];

//     querySnapshot.forEach((doc) => {

//         products.push(doc.data());

//     });

//     // Save products to localStorage

//     localStorage.setItem(
//         CACHE_KEY,
//         JSON.stringify(products)
//     );

//     localStorage.setItem(
//         CACHE_TIME_KEY,
//         Date.now()
//     );

//     displayProducts(products);

// }

// loadProducts();
import { db, auth } from "./firebase-config.js";

import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

/* ==========================================
   TOAST
========================================== */

function showToast(message) {

    const toast = document.getElementById("toast");
    const text = document.getElementById("toast-message");

    text.textContent = "✓ " + message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}

/* ==========================================
   WISHLIST
========================================== */

async function toggleWishlist(productId, button) {

    button.disabled = true;

    try {

        const user = auth.currentUser;

        if (!user) {

            showToast("Please login first.");

            return;

        }

        const wishlistRef = doc(
            db,
            "users",
            user.uid,
            "wishlist",
            productId
        );

        const snap = await getDoc(wishlistRef);

        if (snap.exists()) {

            await deleteDoc(wishlistRef);

            button.classList.remove("saved");

            button.innerHTML = `<i class="far fa-heart"></i>`;

            showToast("Product removed from your Wishlist");

        } else {

            await setDoc(wishlistRef, {

                productId,
                selectedSize: null,
                createdAt: new Date()

            });

            button.classList.add("saved");

            button.innerHTML = `<i class="fas fa-heart"></i>`;

            showToast("Product added to your Wishlist");

        }

    } finally {

        button.disabled = false;

    }

}
function showLoadingCards(count = 6) {

    let html = "";

    for (let i = 0; i < count; i++) {

        html += `

        <div class="product-card">

            <div class="wishlist-btn loading-heart"></div>

            <div class="product-image-wrapper">

                <div class="image-placeholder"></div>

            </div>

            <div class="loading-line title"></div>

            <div class="loading-line text"></div>

            <div class="loading-line price"></div>

            <div class="loading-button"></div>

        </div>

        `;

    }

    productsGrid.innerHTML = html;

}
/* ==========================================
   PRODUCTS
========================================== */

const productsGrid = document.getElementById("products-grid");

async function loadProducts() {

  const productsQuery = query(
    collection(db, "products"),
    where("status", "==", "Active"),
    orderBy("displayOrder")
);

    const querySnapshot = await getDocs(productsQuery);

    const user = auth.currentUser;

    let wishlist = [];

    if (user) {

        const wishlistSnapshot = await getDocs(

            collection(
                db,
                "users",
                user.uid,
                "wishlist"
            )

        );

        wishlist = wishlistSnapshot.docs.map(doc => doc.id);

    }

    let html = "";

    querySnapshot.forEach((doc) => {

        const product = doc.data();

        html += `

<div class="product-card ${product.filterCategory}">

    <button
        class="wishlist-btn ${
            wishlist.includes(doc.id) ? "saved" : ""
        }"
        data-id="${doc.id}">

        <i class="${
            wishlist.includes(doc.id)
                ? "fas fa-heart"
                : "far fa-heart"
        }"></i>

    </button>

    <div class="product-image-wrapper">

        <div class="image-placeholder"></div>

        <img
            src="${product.image}"
            alt="${product.name}"
            class="product-image"
            loading="lazy"
            decoding="async">

    </div>

    <h3>${product.name}</h3>

    <p>${product.paragraph}</p>

    <span class="price">

        UGX ${product.price.toLocaleString()}

    </span>

    <a
        href="product.html?slug=${product.slug}"
        class="product-btn">

        View Product

    </a>

</div>

`;

    });

    productsGrid.innerHTML = html;
    // Apply category from navigation after products are loaded

const hash = window.location.hash;

const map = {

    "#hair-care": "hair",
    "#skin-care": "skin",
    "#wellness": "wellness",
    "#gift-sets": "gift",
    "#all-products": "all"

};

const filter = map[hash];

if (filter) {

    const btn = document.querySelector(
        `.filter-btn[data-filter="${filter}"]`
    );

    if (btn) {

        btn.click();

    }

}
    requestAnimationFrame(() => {

    productsGrid.classList.add("loaded");

});

    /* Fade images in */

    document.querySelectorAll(".product-image").forEach((img) => {

        if (img.complete) {

            img.style.opacity = "1";

            const placeholder = img.previousElementSibling;

            if (placeholder) {

                placeholder.remove();

            }

        } else {

            img.onload = () => {

                img.style.opacity = "1";

                const placeholder = img.previousElementSibling;

                if (placeholder) {

                    placeholder.remove();

                }

            };

        }

    });

}

showLoadingCards();

loadProducts();

/* ==========================================
   WISHLIST CLICK
========================================== */

document.addEventListener("click", async (e) => {

    const button = e.target.closest(".wishlist-btn");

    if (!button) return;

    const productId = button.dataset.id;

    await toggleWishlist(productId, button);

});
