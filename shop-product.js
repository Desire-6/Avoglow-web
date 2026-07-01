import { db } from "./firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const productsGrid =
document.getElementById("products-grid");

async function loadProducts() {

    // Show skeletons FIRST
    productsGrid.innerHTML = "";

    for (let i = 0; i < 8; i++) {

        productsGrid.innerHTML += `

            <div class="skeleton-card">

                <div class="skeleton-img"></div>

                <div class="skeleton-text medium"></div>

                <div class="skeleton-text short"></div>

                <div class="skeleton-text short"></div>

                <div class="skeleton-btn"></div>

            </div>

        `;

    }

    // NOW fetch Firestore
    const querySnapshot =
    await getDocs(collection(db, "products"));

    // Remove skeletons
    productsGrid.innerHTML = "";

    querySnapshot.forEach((doc) => {

        const product = doc.data();

        let categoryClass = "";

        if(product.category === "Hair Care"){
            categoryClass = "hair";
        }

        if(product.category === "Skin Care"){
            categoryClass = "skin";
        }

        if(product.category === "Wellness"){
            categoryClass = "wellness";
        }

        if(product.category === "Gift Sets"){
            categoryClass = "gift";
        }

        productsGrid.innerHTML += `

            <div class="product-card ${categoryClass}">

                <img
                    src="${product.image}"
                    alt="${product.name}"
                    loading="lazy">

                <h3>${product.name}</h3>

                <p>${product.category}</p>

                <span class="price">
                    UGX ${product.price.toLocaleString()}
                </span>

                <a
                    href="product.html?id=${doc.id}"
                    class="product-btn">

                    View Product

                </a>

            </div>

        `;
    });

}
loadProducts();