import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {

    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc

} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
/* ==========================
   LOAD CART
========================== */

let cart = [];

let currentUser = null;

/* ==========================
   ELEMENTS
========================== */

const cartItems =
document.getElementById("cart-items");

const emptyCart =
document.getElementById("empty-cart");

const summaryBox =
document.getElementById("summary-box");

const subtotalElement =
document.getElementById("subtotal");

const totalElement =
document.getElementById("total");

const cartCount =
document.getElementById("cart-count");

const checkoutBtn =
document.getElementById("checkout-btn");

/* ==========================
   FORMAT UGX
========================== */

function formatUGX(amount){

    return "UGX " +
    amount.toLocaleString();

}

/* ==========================
   UPDATE CART BADGE
========================== */

function updateCartBadge(){

    let totalItems = 0;

    cart.forEach(item => {

        totalItems += item.quantity;

    });

    if(cartCount){

        cartCount.textContent =
        totalItems;

    }

}

/* ==========================
   SAVE CART
========================== */

function saveCart(){

    if(!currentUser){

        localStorage.setItem(
            "cart",
            JSON.stringify(cart)
        );

    }

    updateCartBadge();

    renderCart();

}
async function mergeGuestCart(){

    const guestCart =
    JSON.parse(
        localStorage.getItem("cart")
    ) || [];

    if(guestCart.length === 0) return;

    for(const item of guestCart){

        const cartRef = doc(

            db,
            "users",
            currentUser.uid,
            "cart",
            item.slug + "_" + item.size

        );

        const existing =
        await getDoc(cartRef);

        if(existing.exists()){

            const data =
            existing.data();

            item.quantity +=
            data.quantity;

        }

        await setDoc(cartRef,item);

    }

    localStorage.removeItem("cart");

}
/* ==========================
   LOAD FIRESTORE CART
========================== */

async function loadFirestoreCart(){

    cart = [];

    const snapshot = await getDocs(

        collection(
            db,
            "users",
            currentUser.uid,
            "cart"
        )

    );

    console.log("Firestore docs:", snapshot.size);

    snapshot.forEach(doc=>{

        console.log(doc.data());

        cart.push(doc.data());

    });

}

/* ==========================
   INCREASE QTY
========================== */

async function increaseQty(index){

    if(currentUser){

        const item = cart[index];

        item.quantity++;

        await setDoc(

            doc(
                db,
                "users",
                currentUser.uid,
                "cart",
                item.slug + "_" + item.size
            ),

            item

        );

        await loadFirestoreCart();

        updateCartBadge();

        renderCart();

    }else{

        cart[index].quantity++;

        saveCart();

    }

}

/* ==========================
   DECREASE QTY
========================== */

async function decreaseQty(index){

    if(currentUser){

        const item = cart[index];

        if(item.quantity > 1){

            item.quantity--;

            await setDoc(

                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "cart",
                    item.slug + "_" + item.size
                ),

                item

            );

            await loadFirestoreCart();

            updateCartBadge();

            renderCart();

        }

    }else{

        if(cart[index].quantity > 1){

            cart[index].quantity--;

        }

        saveCart();

    }

}

/* ==========================
   REMOVE ITEM
========================== */
let removeIndex = null;

function removeItem(index){

    removeIndex = index;

    document
        .getElementById("remove-modal")
        .classList.add("show");

}

/* ==========================
   RENDER CART
========================== */

function renderCart(){

    cartItems.innerHTML = "";

if(cart.length === 0){

    cartItems.style.display = "none";

    emptyCart.style.display = "block";

    document.getElementById("summary-box").style.display = "none";

    document.getElementById("summary-skeleton").style.display = "none";

    document
        .querySelector(".cart-layout")
        .classList.add("empty");

    if(checkoutBtn){

        checkoutBtn.disabled = true;

    }

    return;

}

  cartItems.style.display = "block";

emptyCart.style.display = "none";

document.getElementById("summary-box").style.display = "block";

document.getElementById("summary-skeleton").style.display = "none";

document
    .querySelector(".cart-layout")
    .classList.remove("empty");

if(checkoutBtn){

    checkoutBtn.disabled = false;

}

    let subtotal = 0;

    cart.forEach((item,index)=>{

        subtotal +=
        item.price *
        item.quantity;

        cartItems.innerHTML += `

        <div class="cart-item">

            <img src="${item.image}"
                 alt="${item.name}">

            <div class="cart-info">

    <h3>
        ${item.name}
    </h3>
<p class="product-subtitle">

    ${item.subtitle || ""}

</p>

<div class="product-meta">

    <span class="size-tag">

        ${item.size || "50ml"}

    </span>

    <span class="stock-tag">

        ✓ In Stock

    </span>

</div>

    <button
        class="remove-btn"
        onclick="removeItem(${index})">

        <i class="fa-solid fa-trash"></i>

        Remove

    </button>

</div>

            <div class="cart-right">

                <div class="item-price">

                    ${formatUGX(
                        item.price *
                        item.quantity
                    )}

                </div>

                <div class="quantity-controls">

                    <button
                    onclick="decreaseQty(${index})">

                    −

                    </button>

                    <span>

                    ${item.quantity}

                    </span>

                    <button
                    onclick="increaseQty(${index})">

                    +

                    </button>

                </div>

            </div>

        </div>

        `;

    });

   subtotalElement.textContent =
formatUGX(subtotal);

totalElement.textContent =
formatUGX(subtotal);

}

/* ==========================
   INITIAL LOAD
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
const recentContainer =
document.getElementById("recently-viewed-container");

const leftArrow =
document.querySelector(".recent-arrow.left");

const rightArrow =
document.querySelector(".recent-arrow.right");

if(recentContainer){

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
if(checkoutBtn){

    checkoutBtn.addEventListener("click",(e)=>{

        e.preventDefault();

        if(auth.currentUser){

            window.location.href="checkout.html";

        }else{

            localStorage.setItem(
                "redirectAfterLogin",
                "checkout.html"
            );

            window.location.href="login.html";

        }

    });

}

const removeModal =
document.getElementById("remove-modal");

const cancelRemove =
document.getElementById("cancel-remove");

const confirmRemove =
document.getElementById("confirm-remove");

if(cancelRemove){

    cancelRemove.addEventListener("click",()=>{

        removeModal.classList.remove("show");

    });

}

if(confirmRemove){

    confirmRemove.addEventListener("click", async ()=>{

   if(removeIndex !== null){

    if(currentUser){

        const item = cart[removeIndex];

        await deleteDoc(

            doc(
                db,
                "users",
                currentUser.uid,
                "cart",
                item.slug + "_" + item.size
            )

        );

        await loadFirestoreCart();

        updateCartBadge();

        renderCart();

    }else{

        cart.splice(removeIndex,1);

        saveCart();

    }

    removeIndex = null;

}

        removeModal.classList.remove("show");

        showToast("Product removed successfully");

    });

}

function showToast(message){

    const toast = document.getElementById("toast");

    toast.innerHTML = `✓ ${message}`;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },3000);

}
onAuthStateChanged(auth, async (user) => {

    currentUser = user;

    // Show loading
    document.getElementById("cart-loading").style.display = "block";
    document.getElementById("summary-loading").style.display = "block";

    document.getElementById("cart-content").style.display = "none";
    document.getElementById("summary-content").style.display = "none";

    if(user){

        await mergeGuestCart();

        await loadFirestoreCart();

    }else{

        cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    }

    updateCartBadge();

    renderCart();

    // Hide loading
    document.getElementById("cart-loading").style.display = "none";
    document.getElementById("summary-loading").style.display = "none";

    document.getElementById("cart-content").style.display = "block";
    document.getElementById("summary-content").style.display = "block";

});

/* ==========================
   MAKE FUNCTIONS GLOBAL
========================== */

window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.removeItem = removeItem;