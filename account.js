import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut,
    updatePassword,
    deleteUser,
    reauthenticateWithCredential,
    GoogleAuthProvider,
    reauthenticateWithPopup,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    limit,
    Timestamp,
    writeBatch,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
const confirmDeleteBtn =
document.getElementById("confirmDeleteBtn");

const deleteBtnText =
confirmDeleteBtn.querySelector(".btn-text");

const deleteBtnLoader =
confirmDeleteBtn.querySelector(".btn-loader");
function showToast(message){

    const toast =
    document.getElementById("toast");

    const text =
    document.getElementById("toast-message");

    text.textContent = "✓ " + message;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },3000);

}
async function getPickupStation(){

    const stationRef = doc(db,"pickupStations","main");

    const snap = await getDoc(stationRef);

    if(snap.exists()){

        return snap.data();

    }

    return null;

}

/* ======================================================
GLOBALS
====================================================== */

let currentUser = null;
/* ======================================================
PAGINATION
====================================================== */

const ORDERS_PER_PAGE = 5;

let allOrders = [];

let filteredOrders = [];

let currentPage = 1;

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
const params = new URLSearchParams(window.location.search);

const requestedSection = params.get("section");

const requestedOrder = params.get("order");

async function openSection(sectionId){

    document
    .querySelectorAll(".account-section")
    .forEach(section=>{

        section.style.display="none";

    });

    document
    .querySelectorAll(".account-sidebar nav a[data-section]")
    .forEach(link=>{

        link.classList.remove("active");

    });

    const section =
    document.getElementById(sectionId);

    if(section){

        section.style.display="block";

    }

    if(sectionId==="orders-section"){

       await loadOrders();

if(requestedOrder){

    setTimeout(()=>{

        const orderCard =
        document.querySelector(
            `[data-order="${requestedOrder}"]`
        );

        if(orderCard){

            orderCard.scrollIntoView({

                behavior:"smooth",

                block:"center"

            });

            orderCard.classList.add("highlight-order");

            setTimeout(()=>{

                orderCard.classList.remove(
                    "highlight-order"
                );

            },4000);

        }

    },300);

}

    }

    if(sectionId==="wishlist-section"){

        loadWishlist();

    }
    if(sectionId==="inbox-section"){

    loadInbox();

}
if(sectionId==="settings-section"){

    loadAccountSettings();

}
    const activeLink =
    document.querySelector(
        `a[data-section="${sectionId}"]`
    );

    if(activeLink){

        activeLink.classList.add("active");

    }

}
async function removeWishlistItem(productId){

    const user = auth.currentUser;

    if(!user) return;

   await deleteDoc(
    doc(
        db,
        "users",
        user.uid,
        "wishlist",
        productId
    )
);

// Remove the card instantly
document
    .getElementById(`wishlist-${productId}`)
    ?.remove();

const container =
document.getElementById("wishlist-container");

if(container.children.length === 0){

    container.innerHTML = `

    <div class="wishlist-empty">

        <i class="fas fa-heart"></i>

        <h3>Your wishlist is empty</h3>

        <p>
            Save products you love so you can find them easily later.
        </p>

        <a href="shop.html"
           class="wishlist-shop-btn">

            Continue Shopping

        </a>

    </div>

    `;

}
showToast("Removed from Wishlist");

}

/* =====================================
ORDER DETAILS
===================================== */

function openOrderDetails(order){

    window.selectedOrder = order;

    document
    .querySelectorAll(".account-section")
    .forEach(section=>{

        section.style.display="none";

    });

    document
    .getElementById("order-details-section")
    .style.display="block";

    renderOrderDetails(order);

}


/* =====================================
TRACK ITEM
===================================== */

function openTracking(){

    document
    .querySelectorAll(".account-section")
    .forEach(section=>{

        section.style.display="none";

    });

    document
    .getElementById("tracking-section")
    .style.display="block";

    renderTracking(window.selectedOrder);

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
    listenForUnreadNotifications();

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

        <a
href="account.html?view=orders">

    <i class="fas fa-box"></i>

    My Orders

</a>

        <a href="account.html?section=wishlist">
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

switch(requestedSection){

    case "orders":
        openSection("orders-section");
        break;

    case "wishlist":
        openSection("wishlist-section");
        break;

    case "inbox":
        openSection("inbox-section");
        break;

    default:
        openSection("dashboard-section");

}

});
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
async function loadOrders(){

    const container =
    document.getElementById("ordersContainer");

    if(!container || !currentUser) return;

    container.innerHTML = "";
    allOrders = [];
filteredOrders = [];
currentPage = 1;
    let totalOrders = 0;
let pendingOrders = 0;
let readyOrders = 0;
let completedOrders = 0;

    const q = query(

        collection(db,"orders"),

        where("userId","==",currentUser.uid),

        orderBy("createdAt","desc")

    );

    const snapshot = await getDocs(q);

    if(snapshot.empty){

        container.innerHTML = `

        <div class="no-orders">

            <i class="fas fa-box-open fa-3x"></i>

            <h3>No Orders Yet</h3>

            <p>

                You haven't placed any orders yet.

            </p>

        </div>

        `;

        return;

    }

    snapshot.forEach(doc=>{

        const order = doc.data();
        allOrders.push(order);
        totalOrders++;

switch(order.status){

    case "Pending":
        pendingOrders++;
        break;

    case "Ready for Pickup":
        readyOrders++;
        break;

    case "Completed":
        completedOrders++;
        break;

}

        const created =
        order.createdAt.toDate();
       const firstItem = order.items[0];
       const extraProducts = order.items.length - 1;
     const estimatedFrom = addWorkingDays(created, 2);
const estimatedTo = addWorkingDays(created, 3);

const deliveryText =

order.status === "Completed"

? `Delivered on
<strong>
${
    order.deliveredAt
        ? formatDeliveryDate(new Date(order.deliveredAt))
        : formatDeliveryDate(created)
}stej
</strong>`

: `Delivered between
<strong>
${formatDeliveryDate(estimatedFrom)}
and
${formatDeliveryDate(estimatedTo)}
</strong>`;
    });
    document.getElementById("count-all").textContent =
totalOrders;

document.getElementById("count-pending").textContent =
pendingOrders;

document.getElementById("count-ready").textContent =
readyOrders;

document.getElementById("count-completed").textContent =
completedOrders;
filteredOrders = [...allOrders];

renderOrders();

}

async function loadWishlist(){

    const container =
    document.getElementById("wishlist-container");

    container.innerHTML =
    `<p class="loading-text">Loading wishlist...</p>`;

    const user = auth.currentUser;

    if(!user){

        container.innerHTML = "";

        return;

    }

    const wishlistSnapshot = await getDocs(

        collection(
            db,
            "users",
            user.uid,
            "wishlist"
        )

    );

    if(wishlistSnapshot.empty){

        container.innerHTML = `

        <div class="wishlist-empty">

            <i class="fas fa-heart"></i>

            <h3>Your wishlist is empty</h3>

            <p>

                Save products you love so you can find them easily later.

            </p>

            <a href="shop.html" class="wishlist-shop-btn">

                Continue Shopping

            </a>

        </div>

        `;

        return;

    }

    container.innerHTML = "";

    for(const wish of wishlistSnapshot.docs){

        const wishlistItem = wish.data();

const productId = wishlistItem.productId || wish.id;

        const productRef =
        doc(db,"products",productId);

        const productSnap =
        await getDoc(productRef);

        if(!productSnap.exists()) continue;

        const product = productSnap.data();
        const sizes = product.sizes || [];

       container.innerHTML += `

<div class="wishlist-card" id="wishlist-${productId}">

    <a href="product.html?slug=${product.slug}">
        <img src="${product.image}" alt="${product.name}">
    </a>

    <div class="wishlist-info">

        <h3>
            <a href="product.html?slug=${product.slug}">
                ${product.name}
            </a>
        </h3>

        <p>${product.paragraph}</p>

        <div class="wishlist-size-buttons">

        ${product.sizes.map((size,index)=>`

            <button
                class="wishlist-size-btn ${index===0?"active":""}"
                data-size="${size.size}"
                data-price="${size.price}">

                ${size.size}

            </button>

        `).join("")}

        </div>

    </div>

    <div class="wishlist-actions">

        <div class="wishlist-selected-price">

            UGX ${Number(product.sizes[0].price).toLocaleString()}

        </div>
        <div class="wishlist-buttons">

        <button
            class="wishlist-cart-btn"
            data-id="${productId}"
            data-size="${wishlistItem.selectedSize || product.sizes[0].size}">

            Add to Cart

        </button>

        <button
            class="wishlist-remove-btn"
            data-id="${productId}">

            Remove

        </button>
        </div>

    </div>

</div>

`;
    }

}
async function addWishlistItemToCart(productId, selectedSize){

    const user = auth.currentUser;

    if(!user) return;

  const cartRef = doc(
    db,
    "users",
    user.uid,
    "cart",
    productId + "_" + selectedSize
);

    const cartSnap = await getDoc(cartRef);

    if(cartSnap.exists()){

        const cartData = cartSnap.data();

        await updateDoc(cartRef,{
            quantity: cartData.quantity + 1
        });

    }else{

        const productSnap = await getDoc(
            doc(db,"products",productId)
        );

        if(!productSnap.exists()) return;

      const product = productSnap.data();

const selectedVariant =
product.sizes.find(
    s => s.size === selectedSize
);

await setDoc(cartRef,{

    slug: product.slug,

    name: product.name,

    subtitle: product.paragraph,

    image: product.image,

    size: selectedSize,

    price: selectedVariant.price,

    quantity:1

});

    }
    await updateCartBadge();

    showToast("Product successfully added to Cart");
}

function renderOrders(){

    const container =
    document.getElementById("ordersContainer");

    container.innerHTML = "";
    if(filteredOrders.length === 0){

    container.innerHTML = `

    <div class="no-orders">

        <i class="fas fa-box-open fa-3x"></i>

        <h3>No Orders Found</h3>

        <p>

            There are no orders matching this filter.

        </p>

    </div>

    `;

    updatePagination();

    return;

}

    const start =
    (currentPage - 1) * ORDERS_PER_PAGE;

    const end =
    start + ORDERS_PER_PAGE;

    const pageOrders =
    filteredOrders.slice(start, end);

    pageOrders.forEach(order=>{

        renderOrderCard(order, container);

    });

   updatePagination();

return;

}
function renderOrderCard(order, container){

    const created = order.createdAt.toDate();

    const firstItem = order.items[0];

    const extraProducts =
    order.items.length - 1;

    const estimatedFrom =
    addWorkingDays(created,2);

    const estimatedTo =
    addWorkingDays(created,3);

    container.innerHTML += `

<div
    class="order-card"
    data-status="${order.status}"
    data-order="${order.orderNumber}"
    data-product="${order.items.map(item => item.name).join(" ")}">

    <div class="order-image">

        <img src="${firstItem.image}" alt="${firstItem.name}">

    </div>

    <div class="order-details">

        <h3>${firstItem.name}</h3>

        <p>Size: ${firstItem.size}</p>

        <p>Order # ${order.orderNumber}</p>

       <span class="status-badge ${order.status.replace(/\s+/g,"-").toLowerCase()}">

${order.status}

</span>

     <p class="delivery-date">

${
    order.status === "Completed"

    ?

    `Delivered on
    <strong>
       ${
    order.deliveredAt
    ? formatDeliveryDate(order.deliveredAt)
    : formatDeliveryDate(created)
}
    </strong>`

    :

    `Delivered between
    <strong>
       ${
    order.estimatedFrom && order.estimatedTo

    ?

    `${formatDeliveryDate(order.estimatedFrom)} and ${formatDeliveryDate(order.estimatedTo)}`

    :

    `${formatDeliveryDate(estimatedFrom)} and ${formatDeliveryDate(estimatedTo)}`
}
    </strong>`
}

</p>
${
    extraProducts > 0

    ?

    `<button
        class="more-items-btn"
        data-order="${order.orderNumber}">

        +${extraProducts} more product${extraProducts > 1 ? "s" : ""}

    </button>

    <div
        class="more-items-list"
        id="items-${order.orderNumber}"
        style="display:none;">

        <div class="hidden-products">

    <div class="hidden-products-title">

        Other Products In This Order

    </div>

    ${order.items.slice(1).map(item => `

            <div class="mini-product">

                <img
                    src="${item.image}"
                    alt="${item.name}"
                >

                <div class="mini-product-info">

                    <strong>${item.name}</strong>

                    <p>${item.size}</p>

                    <span>Qty: ${item.quantity}</span>

                </div>

            </div>

        `).join("")}
        </div>

    </div>`

    :

    ""

}
    </div>

    <div class="order-side">

        <button
            class="view-order-btn"
            data-order="${order.orderNumber}">

            View Details

            <i class="fas fa-arrow-right"></i>

        </button>

    </div>

</div>

`;
}
document.addEventListener("click",(e)=>{

    const btn =
    e.target.closest(".view-order-btn");

    if(!btn) return;

    const orderNumber =
    btn.dataset.order;

    const order =
    allOrders.find(o=>
        o.orderNumber===orderNumber
    );

    if(order){

        openOrderDetails(order);

    }

});
function updatePagination(){

    const totalPages =
    Math.max(
        1,
        Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
    );

    document.getElementById("pageInfo").textContent =
    `Page ${currentPage} of ${totalPages}`;

    document.getElementById("prevPage").disabled =
    currentPage === 1;

    document.getElementById("nextPage").disabled =
    currentPage >= totalPages;

}
document.getElementById("prevPage").onclick = ()=>{

    if(currentPage>1){

        currentPage--;

        renderOrders();

    }

};

document.getElementById("nextPage").onclick = ()=>{

    const totalPages =

    Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);

    if(currentPage<totalPages){

        currentPage++;

        renderOrders();
        document
.getElementById("orders-section")
.scrollIntoView({

    behavior:"smooth",

    block:"start"

});

    }

};
function addWorkingDays(startDate, days) {

    const date = new Date(startDate);
    let added = 0;

    while (added < days) {

        date.setDate(date.getDate() + 1);

        // Skip Sunday (0 = Sunday)
        if (date.getDay() !== 0) {
            added++;
        }

    }

    return date;

}
function formatDeliveryDate(dateString){

    const date = new Date(dateString);

    return date.toLocaleDateString("en-GB",{

        weekday:"long",

        day:"numeric",

        month:"long"

    });

}
document.addEventListener("click", (e) => {

    if (!e.target.classList.contains("more-items-btn")) return;

    const button = e.target;

    const order = button.dataset.order;

    const list = document.getElementById(`items-${order}`);

    if (!list) return;

    if (list.style.display === "none" || list.style.display === "") {

        list.style.display = "block";

        button.textContent = "Hide Items";

    } else {

        list.style.display = "none";

        const extraProducts = list.querySelectorAll(".mini-product").length;

        button.textContent =
            `+${extraProducts} more product${extraProducts > 1 ? "s" : ""}`;

    }

});

const searchInput =
document.getElementById("orderSearch");

searchInput.addEventListener("input",()=>{

    const value =
    searchInput.value.toLowerCase();

    filteredOrders =
    allOrders.filter(order=>{

        const searchable =
        (
            order.orderNumber + " " +
            order.items.map(item=>item.name).join(" ")
        ).toLowerCase();

        return searchable.includes(value);

    });

    currentPage = 1;

    renderOrders();

});
const filterButtons =
document.querySelectorAll(".filter-pill");

filterButtons.forEach(button=>{

    button.addEventListener("click",()=>{

        filterButtons.forEach(btn=>
            btn.classList.remove("active")
        );

        button.classList.add("active");

        const filter =
        button.dataset.filter;

        if(filter==="all"){

            filteredOrders=[...allOrders];

        }else{

            filteredOrders =
            allOrders.filter(order=>
                order.status===filter
            );

        }

        currentPage = 1;

        renderOrders();

    });

});
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
async function renderOrderDetails(order){

    const section = document.getElementById("order-details-section");

    const created = order.createdAt.toDate();

    const estimatedFrom = addWorkingDays(created,2);

    const estimatedTo = addWorkingDays(created,3);

    const subtotal = order.items.reduce((sum,item)=>{

        return sum + (item.price * item.quantity);

    },0);
    const pickupStation = await getPickupStation();

    section.innerHTML = `

<div class="order-details-page">

    <div class="details-top-bar">

        <button class="back-orders">

            <i class="fas fa-arrow-left"></i>
            Order Details

        </button>

    </div>

    <div class="details-header">

        <div>

            <h1>Order #${order.orderNumber}</h1>

            <span class="status-badge ${order.status.replace(/\s+/g,"-").toLowerCase()}">

                ${order.status}

            </span>

            <p>

                Placed on
                ${created.toLocaleDateString("en-GB",{

                    day:"numeric",

                    month:"long",

                    year:"numeric"

                })}

            </p>

        </div>

        <div class="order-total">

            <span>Total</span>

            <h2>

                UGX ${Number(order.total).toLocaleString()}

            </h2>

        </div>

    </div>

    <hr>
    <div class="order-action-bar">

 ${
    order.status === "Completed"

    ?

    `
    <div class="completed-actions">

        <button class="status-history-btn">

            <i class="fas fa-history"></i>

            Status History

        </button>

    </div>
    `

    :

    `
    <button class="track-order-btn">

        Track My Order

    </button>
    `
}

</div>

    <h3 class="section-title">

        Items In Your Order

    </h3>

    ${order.items.map(item=>`

    <div class="details-item">

    <img
        src="${item.image}"
        class="details-product-image"
    >

    <div class="details-info">

        <h4>${item.name}</h4>

        <p>Size: ${item.size}</p>

        <p>Quantity: ${item.quantity}</p>

       <div class="details-price">

    <div class="price-main">

        UGX ${(item.price * item.quantity).toLocaleString()}

    </div>

    ${
        item.quantity > 1
        ?
        `
        <div class="price-sub">

            UGX ${item.price.toLocaleString()} each

        </div>
        `
        :
        ""
    }

</div>

    </div>

</div>

    `).join("")}

    <div class="details-grid">

        <div class="details-box">

            <h3>

                Payment Information

            </h3>

            <div class="details-box-content">

               <div class="info-group">

<span class="info-label">

Payment Method

</span>

<span>

${order.payment.method}

</span>

</div>

${
order.payment.phone
?
`
<div class="info-group">

    <span class="info-label">

        Payment Phone

    </span>

    <span>

        ${order.payment.phone}

    </span>

</div>
`
:
""
}
                <br>

                <hr>

                <br>

                <p>

                    Subtotal:

                    UGX ${subtotal.toLocaleString()}

                </p>

                <p>

                    Delivery:

                    UGX ${(order.deliveryFee || 0).toLocaleString()}

                </p>

                <br>

                <h3>

                    Total:

                    UGX ${Number(order.total).toLocaleString()}

                </h3>

            </div>

        </div>

        <div class="details-box">

<h3>Delivery Information</h3>

${
order.delivery.homeDelivery

?

`
<div class="info-group">

<span class="info-label">

Delivery Method

</span>

<p>

Home Delivery

</p>

</div>

<div class="info-group">

<span class="info-label">

Customer

</span>

<p>${order.address.fullName}</p>

</div>

<div class="info-group">

<span class="info-label">

Phone

</span>

<p>${order.address.phone}</p>

</div>

<div class="info-group">

<span class="info-label">

Delivery Address

</span>

<p>

${order.address.address}<br>

${order.address.city},

${order.address.district}

</p>

</div>

`

:

`

<div class="info-group">

<span class="info-label">

Delivery Method

</span>

<p>Pickup Station</p>

</div>

<div class="info-group">

<span class="info-label">

Pickup Station Address

</span>

<p>

${pickupStation.name}<br>

${pickupStation.building}<br>

${pickupStation.landmark}

</p>

</div>

<div class="info-group">

<span class="info-label">

Opening Hours

</span>

<p>

${pickupStation.weekdays}<br>

${pickupStation.weekend}

</p>

</div>

`

}

<div class="info-group">

<span class="info-label">

Estimated Delivery

</span>

<p>

${formatDeliveryDate(estimatedFrom)}

-

${formatDeliveryDate(estimatedTo)}

</p>

</div>

</div>

        </div>

    </div>

</div>

`;

}
document.addEventListener("click",(e)=>{

    if(e.target.closest(".back-orders")){

        openSection("orders-section");

    }

});
document.addEventListener("click",(e)=>{

    if(e.target.closest(".track-order-btn")){

        openTracking();

    }

});
document.addEventListener("click",(e)=>{

    if(e.target.closest(".status-history-btn")){

        openTracking();

    }

});
async function renderTracking(order){

const section=document.getElementById("tracking-section");

const trackingRef=collection(

db,

"orders",

order.orderNumber,

"tracking"

);

const trackingQuery=query(

trackingRef,

orderBy("order")

);

onSnapshot(trackingQuery,(snapshot)=>{

const timeline=[];

snapshot.forEach(doc=>{

timeline.push(doc.data());

});

renderTrackingTimeline(section,timeline,order);

});

}
function renderTrackingTimeline(section,timeline,order){

section.innerHTML = `

<div class="tracking-page">

<button class="back-details">

<i class="fas fa-arrow-left"></i>

Back to Details

</button>

<h2>

${
order.status==="Completed"

?

"Order Status History"

:

"Track Your Order"

}

</h2>

<div class="tracking-timeline">

${timeline.map((step,index)=>`

<div class="tracking-step">

<div class="tracking-icon ${step.completed?"done":""}">

${
step.completed

?

'<i class="fas fa-check"></i>'

:

(index===timeline.findIndex(s=>!s.completed)

?

'<i class="fas fa-clock"></i>'

:

"")

}

</div>

<div class="tracking-content">

<div class="tracking-title-row">

<h4>${step.stage}</h4>

${
step.completed

?

`<span class="tracking-state completed">Completed</span>`

:

index===timeline.findIndex(s=>!s.completed)

?

`<span class="tracking-state current">Current</span>`

:

`<span class="tracking-state waiting">Waiting</span>`

}

</div>

<p>

${
step.completed ||
index === timeline.findIndex(s => !s.completed)

? getTrackingDescription(step.stage)

: ""
}

</p>

<small>

${
step.completed && step.date

? step.date.toDate().toLocaleDateString("en-GB",{
    day:"numeric",
    month:"long",
    year:"numeric"
})

: ""

}

</small>

</div>

</div>

`).join("")}

</div>

</div>

`;

}
function getTrackingDescription(stage){

switch(stage){

case "Order Placed":

return "Your order has been received successfully.";

case "Preparing Order":

return "Our team is preparing your products for dispatch.";

case "Ready for Pickup":

return "Your order is ready for pickup or dispatch.";

case "Delivered":

return "Your package has been delivered successfully.";

default:

return "";

}

}
document.addEventListener("click",(e)=>{

    if(e.target.closest(".back-details")){

        openOrderDetails(window.selectedOrder);

    }

});
document.addEventListener("click", async (e) => {

 if(e.target.closest(".wishlist-remove-btn")){

    const btn = e.target.closest(".wishlist-remove-btn");

    // Prevent double-clicks
    btn.disabled = true;
    btn.style.pointerEvents = "none";

    const id = btn.dataset.id;

    await removeWishlistItem(id);

    return;
}

   if(e.target.classList.contains("wishlist-cart-btn")){

        const productId = e.target.dataset.id;
      const wrapper =
e.target.closest(".wishlist-size-picker");

const activeSize =
wrapper.querySelector(".wishlist-size-btn.active");

const size =
activeSize.dataset.size;

if(!size){

    const wrapper = e.target.closest(".wishlist-size-select");

    size = wrapper.querySelector(".wishlist-size-dropdown").value;

}

        await addWishlistItemToCart(productId, size);

    }

});
document.addEventListener("click", async (e) => {

    // ADD TO CART
    if (e.target.closest(".wishlist-cart-btn")) {

        const btn = e.target.closest(".wishlist-cart-btn");

        const productId = btn.dataset.id;

        const size = btn.dataset.size;

        await addWishlistItemToCart(productId, size);

        return;
    }

    // SIZE BUTTONS
    if (!e.target.classList.contains("wishlist-size-btn")) return;

    const card = e.target.closest(".wishlist-card");

    card.querySelectorAll(".wishlist-size-btn")
        .forEach(btn => btn.classList.remove("active"));

    e.target.classList.add("active");

    card.querySelector(".wishlist-selected-price").textContent =
        "UGX " + Number(e.target.dataset.price).toLocaleString();

    card.querySelector(".wishlist-cart-btn").dataset.size =
        e.target.dataset.size;

});
function formatTimeAgo(timestamp){

    if(!timestamp) return "";

    const date = timestamp.toDate();

    const seconds =
    Math.floor((Date.now() - date.getTime()) / 1000);

    if(seconds < 60){

        return "Just now";

    }

    if(seconds < 3600){

        return Math.floor(seconds/60) + " mins ago";

    }

    if(seconds < 86400){

        return Math.floor(seconds/3600) + " hrs ago";

    }

    return Math.floor(seconds/86400) + " days ago";

}
function updateNotificationBadge(count){

    const badge =

        document.getElementById(

            "notification-badge"

        );

    if(!badge) return;


    if(count > 0){

        badge.textContent =

            count > 99

            ? "99+"

            : count;


        badge.classList.add(

            "has-notifications"

        );

    }

    else{

        badge.textContent = "";

        badge.classList.remove(

            "has-notifications"

        );

    }

}
let notificationBadgeListener = null;

function listenForUnreadNotifications(){

    if(!currentUser) return;

    if(notificationBadgeListener){

        notificationBadgeListener();

    }

    const q = query(

        collection(db, "notifications"),

        where("userId", "==", currentUser.uid),

        where("isRead", "==", false)

    );

    notificationBadgeListener = onSnapshot(

        q,

        (snapshot) => {

            updateNotificationBadge(

                snapshot.size

            );

        },

        (error) => {

            console.error(

                "Notification badge error:",

                error

            );

            updateNotificationBadge(0);

        }

    );

}
let inboxListener = null;
function getAdminNotificationIcon(category){

    switch(category){

        case "Promotion":

            return `
                <i class="fa-solid fa-tag"></i>
            `;

        case "Reminder":

            return `
                <i class="fa-solid fa-clock"></i>
            `;

        case "Order Update":

            return `
                <i class="fa-solid fa-box"></i>
            `;

        case "Custom":

            return `
                <i class="fa-solid fa-message"></i>
            `;

        default:

            return `
                <i class="fa-solid fa-bell"></i>
            `;

    }

}

function loadInbox(){

    if(!currentUser) return;

    const container =
    document.getElementById("notifications-container");

    const summary =
    document.getElementById("notification-summary");

    container.innerHTML = "<p>Loading notifications...</p>";

    if(inboxListener){

        inboxListener();

    }

    const q = query(

        collection(db,"notifications"),

        where("userId","==",currentUser.uid),

        orderBy("createdAt","desc")

    );

    inboxListener = onSnapshot(q,(snapshot)=>{

        container.innerHTML = "";

        if(snapshot.empty){

            container.innerHTML = `

                <div class="wishlist-empty">

                    <i class="fas fa-bell-slash"></i>

                    <h3>No Notifications Yet</h3>

                    <p>

                        We'll notify you when something important happens.

                    </p>

                </div>

            `;

            summary.textContent =
            "You have 0 unread notifications";

            updateNotificationBadge(0);

            return;

        }

        let unread = 0;

        snapshot.forEach(docSnap=>{

    const notification = docSnap.data();

    if(!notification.isRead){

        unread++;

    }
    const action = notification.action || {};

let notificationHTML = "";


// ==========================================
// ORDER NOTIFICATION
// ==========================================

if(notification.type === "order"){

    const image =

        action.productImage ||

        "images/product-placeholder.png";


    const product =

        action.productName ||

        "Order";


    const productText =

        action.totalItems > 1

        ?

        `${product} +${action.totalItems - 1} more item${
            action.totalItems > 2 ? "s" : ""
        }`

        :

        product;


    const deliveryText =

        action.estimatedFrom &&

        action.estimatedTo

        ?

        `${formatDeliveryDate(action.estimatedFrom)}
        -
        ${formatDeliveryDate(action.estimatedTo)}`

        :

        "";


    notificationHTML = `

        <div class="notification-body">

            <div class="notification-product-image">

                <img

                    src="${image}"

                    alt="${product}">

            </div>


            <div class="notification-content">

                <h3 class="notification-title">

                    ${notification.title}

                </h3>


                <p class="notification-message">

                    ${notification.message}

                </p>


                <h4>

                    ${productText}

                </h4>


                <div class="notification-delivery">

                    <span>

                        Estimated Delivery

                    </span>


                    <strong>

                        ${deliveryText}

                    </strong>

                </div>

            </div>

        </div>

    `;

}


// ==========================================
// ADMIN NOTIFICATION
// ==========================================

else if(notification.type === "admin"){

    notificationHTML = `

        <div class="notification-body admin-notification-body">

           <div class="admin-notification-icon">

    ${getAdminNotificationIcon(

        notification.category

    )}

</div>


            <div class="notification-content">

                <div class="admin-notification-type ${

    (notification.category || "notification")

        .toLowerCase()

        .replace(/\s+/g, "-")

}">

                    ${notification.category || "Notification"}

                </div>


                <h3 class="notification-title">

                    ${notification.title}

                </h3>


                <p class="notification-message">

                    ${notification.message}

                </p>

            </div>

        </div>

    `;

}


else{

    notificationHTML = `

        <div class="notification-body">

            <div class="admin-notification-icon">

                <i class="fa-solid fa-bell"></i>

            </div>


            <div class="notification-content">

                <h3 class="notification-title">

                    ${notification.title}

                </h3>


                <p class="notification-message">

                    ${notification.message}

                </p>

            </div>

        </div>

    `;

}


container.innerHTML += `

    <div

        class="notification-card

        ${notification.isRead ? "read" : "unread"}"

    >

        <div class="notification-header">

            <span class="notification-date">

                ${formatNotificationDate(

                    notification.createdAt

                )}

            </span>


           <button

    class="notification-link"

    onclick="openNotification('${docSnap.id}')"

>

    ${
        notification.type === "order"

        ? "View Order →"

        : "Mark as Read"

    }

</button>

        </div>


        ${notificationHTML}

    </div>

`;
});

        summary.textContent =

        `You have ${unread} unread notification${unread==1?"":"s"}`;

        updateNotificationBadge(unread);

    });

}

window.openNotification = async function(notificationId){

    try{

        const notificationRef = doc(

            db,

            "notifications",

            notificationId

        );

        const snap = await getDoc(notificationRef);

        if(!snap.exists()) return;

        const notification = snap.data();

        await updateDoc(

            notificationRef,

            {

                isRead: true

            }

        );

        switch(notification.type){

            case "order":{

                const action =

                    notification.action || {};

                window.location.href =

                    `account.html?section=orders&order=${
                        action.orderNumber
                    }`;

                break;

            }

            case "wishlist":

                window.location.href =

                    "account.html?section=wishlist";

                break;


            case "product":

                window.location.href =

                    "products.html";

                break;


            case "admin":

                // No redirect.

                break;

        }

    }

    catch(error){

        console.error(

            "Error opening notification:",

            error

        );

    }

};
async function markAllNotificationsRead(){

    if(!currentUser) return;

    const q = query(

        collection(db,"notifications"),

        where("userId","==",currentUser.uid),

        where("isRead","==",false)

    );

    const snapshot = await getDocs(q);

    if(snapshot.empty) return;

    const batch = writeBatch(db);

    snapshot.forEach(docSnap=>{

        batch.update(

            docSnap.ref,

            {

                isRead:true

            }

        );

    });

    await batch.commit();

}
const markAllBtn =

document.getElementById(

    "mark-all-read"

);

if(markAllBtn){

    markAllBtn.addEventListener(

        "click",

        markAllNotificationsRead

    );

}
function formatNotificationDate(timestamp){

    if(!timestamp) return "";

    const date = timestamp.toDate();

    const today = new Date();

    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    const sameDay =

        date.getDate() === today.getDate() &&

        date.getMonth() === today.getMonth() &&

        date.getFullYear() === today.getFullYear();

    if(sameDay){

        return "Today";

    }

    const sameYesterday =

        date.getDate() === yesterday.getDate() &&

        date.getMonth() === yesterday.getMonth() &&

        date.getFullYear() === yesterday.getFullYear();

    if(sameYesterday){

        return "Yesterday";

    }

    return date.toLocaleDateString(

        "en-GB",

        {

            day:"numeric",

            month:"long"

        }

    );

}
async function loadAccountSettings(){

    const user = auth.currentUser;

    if(!user) return;

    const snap = await getDoc(

        doc(

            db,

            "users",

            user.uid

        )

    );

    if(!snap.exists()) return;

    const data = snap.data();

    document.getElementById("settings-name").value =
        data.name || "";

    document.getElementById("settings-email").value =
        data.email || "";

    document.getElementById("settings-phone").value =
        data.phone || "";

    // document.getElementById("shipping-district").value =
    //     data.district || "";

    // document.getElementById("shipping-city").value =
    //     data.city || "";

    // document.getElementById("shipping-address").value =
    //     data.address || "";

    document.getElementById("account-status").textContent =
        data.status || "Active";

    if(data.createdAt){

        document.getElementById("member-since").textContent =
            data.createdAt.toDate().toLocaleDateString();

    }

}
document.getElementById("save-profile-btn")

.addEventListener(

    "click",

    async()=>{

        await updateDoc(

            doc(db,"users",auth.currentUser.uid),

            {

                name:

                    document.getElementById("settings-name").value,

                phone:

                    document.getElementById("settings-phone").value

            }

        );

        showToast("Profile updated successfully.");

    }

);
// document.getElementById("save-address-btn")

// .addEventListener(

//     "click",

//     async()=>{

//         await updateDoc(

//             doc(db,"users",auth.currentUser.uid),

//             {

//                 district:

//                     document.getElementById("shipping-district").value,

//                 city:

//                     document.getElementById("shipping-city").value,

//                 address:

//                     document.getElementById("shipping-address").value

//             }

//         );

//         showToast("Shipping address saved.");

//     }

// );
document

.getElementById("change-password-btn")

.addEventListener(

"click",

async()=>{

const currentPassword=

document.getElementById(

"current-password"

).value;

const newPassword=

document.getElementById(

"new-password"

).value;

const confirmPassword=

document.getElementById(

"confirm-password"

).value;

if(newPassword.length<6){

showToast(

"Password must be at least 6 characters.",

"error"

);

return;

}

if(newPassword!==confirmPassword){

showToast(

"Passwords do not match.",

"error"

);

return;

}

try{

const credential=

EmailAuthProvider.credential(

auth.currentUser.email,

currentPassword

);

await reauthenticateWithCredential(

auth.currentUser,

credential

);

await updatePassword(

auth.currentUser,

newPassword

);

document.getElementById(

"current-password"

).value="";

document.getElementById(

"new-password"

).value="";

document.getElementById(

"confirm-password"

).value="";

showToast(

"Password updated successfully."

);

}

catch(error){

console.error(error);

showToast(

"Current password is incorrect.",

"error"

);

}

}

);
// document

// .getElementById("delete-account-btn")

// .addEventListener(

// "click",

// async()=>{

// try{

// await deleteDoc(

// doc(

// db,

// "users",

// auth.currentUser.uid

// )

// );

// await deleteUser(

// auth.currentUser

// );

// showToast(

// "Account deleted."

// );

// window.location.href="index.html";

// }

// catch(error){

// console.error(error);

// }

// }

// );
/* ===========================================
   USER SUBCOLLECTIONS
=========================================== */

const USER_SUBCOLLECTIONS = [

    "cart",

    "profile",

    "wishlist",

    "messages",

    "inbox",

    "orders",

    "settings"

];
/* ===========================================
   DELETE ONE SUBCOLLECTION
=========================================== */

async function deleteSubcollection(uid, subcollectionName){

    const snapshot = await getDocs(

        collection(

            db,

            "users",

            uid,

            subcollectionName

        )

    );

    if(snapshot.empty){

        return;

    }

    const batch = writeBatch(db);

    snapshot.forEach(document=>{

        batch.delete(document.ref);

    });

    await batch.commit();

}
/* ===========================================
   DELETE DOCUMENTS FROM GLOBAL COLLECTION
=========================================== */

async function deleteGlobalDocuments(collectionName, uid){

    const q = query(

        collection(db, collectionName),

        where("userId", "==", uid)

    );

    const snapshot = await getDocs(q);

    if(snapshot.empty){

        return;

    }

    const batch = writeBatch(db);

    snapshot.forEach(document=>{

        batch.delete(document.ref);

    });

    await batch.commit();

}
/* ===========================================
   DELETE USER DATA
=========================================== */

async function deleteUserData(uid){

    /* ---------------------------
       Delete User Subcollections
    ---------------------------- */

    for(const subcollection of USER_SUBCOLLECTIONS){

        try{

            await deleteSubcollection(uid, subcollection);

        }

        catch(error){

            console.warn(

                "Couldn't delete",

                subcollection,

                error

            );

        }

    }

    /* ---------------------------
       Delete Global Documents
    ---------------------------- */

    try{

       await deleteOrders(uid);

    }

    catch(error){

        console.warn(error);

    }

    try{

        await deleteGlobalDocuments("notifications", uid);

    }

    catch(error){

        console.warn(error);

    }

    try{

        await deleteGlobalDocuments("reviews", uid);

    }

    catch(error){

        console.warn(error);

    }

    /* ---------------------------
       Delete User Document
    ---------------------------- */

    await deleteDoc(

        doc(db, "users", uid)

    );

}
async function deleteOrders(uid){

    const q = query(

        collection(db,"orders"),

        where("userId","==",uid)

    );

    const snapshot = await getDocs(q);

    for(const orderDocument of snapshot.docs){

        // delete tracking

        const trackingSnapshot = await getDocs(

            collection(

                db,

                "orders",

                orderDocument.id,

                "tracking"

            )

        );

        const trackingBatch = writeBatch(db);

        trackingSnapshot.forEach(doc=>{

            trackingBatch.delete(doc.ref);

        });

        await trackingBatch.commit();

        // delete order

        await deleteDoc(orderDocument.ref);

    }

}
const deleteModal =
document.getElementById("deleteAccountModal");

document
.getElementById("delete-account-btn")
.addEventListener("click",()=>{

    const user = auth.currentUser;

    if(!user){

        showToast(

            "Please login again.",

            "error"

        );

        return;

    }

    const provider =

        user.providerData[0].providerId;

    if(provider==="password"){

        document
        .getElementById("passwordContainer")
        .style.display="block";

    }

    else{

        document
        .getElementById("passwordContainer")
        .style.display="none";

    }

    deleteModal.classList.remove("hidden");

});
document

.getElementById("cancelDeleteBtn")

.addEventListener(

"click",

()=>{

    deleteModal.classList.add("hidden");

}

);
document
.getElementById("confirmDeleteBtn")
.addEventListener(

"click",

async()=>{
    confirmDeleteBtn.disabled = true;

deleteBtnText.classList.add("hidden");

deleteBtnLoader.classList.remove("hidden");
  
try{

const user = auth.currentUser;

const provider =
user.providerData[0].providerId;

/*==============================
EMAIL USERS
==============================*/

if(provider==="password"){

const password =
document
.getElementById("deletePassword")
.value;

const credential =
EmailAuthProvider.credential(

user.email,

password

);

await reauthenticateWithCredential(

user,

credential

);

}

/*==============================
GOOGLE USERS
==============================*/

else if(provider==="google.com"){

const googleProvider =
new GoogleAuthProvider();

await reauthenticateWithPopup(

user,

googleProvider

);

}

/*==============================
DELETE FIRESTORE DATA
==============================*/

await deleteUserData(user.uid);

/*==============================
DELETE AUTH ACCOUNT
==============================*/

await deleteUser(user);

showToast(

"Account deleted successfully."

);

window.location.href="index.html";

}

catch(error){
    confirmDeleteBtn.disabled = false;

deleteBtnLoader.classList.add("hidden");

deleteBtnText.classList.remove("hidden");

console.error(error);

showToast(

error.message,

"error"

);

}

});
