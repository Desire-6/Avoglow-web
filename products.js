// import { db } from "./firebase.js";

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
import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const productsGrid =
document.getElementById("products-grid");

async function loadProducts() {

const productsQuery = query(
    collection(db, "products"),
    orderBy("displayOrder")
);

const querySnapshot =
await getDocs(productsQuery);

  productsGrid.innerHTML = "";

  querySnapshot.forEach((doc) => {

    const product = doc.data();

    productsGrid.innerHTML += `

      <div class="product-card ${product.filterCategory}">

        <img src="${product.image}" alt="${product.name}">

        <h3>${product.name}</h3>

        <p>${product.paragraph}</p>

        <span class="price">
          UGX ${product.price.toLocaleString()}
        </span>

       <a href="product.html?slug=${product.slug}"
       class="product-btn">
          View Product
        </a>

      </div>

    `;
  });
}

loadProducts();