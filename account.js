import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

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

function openSection(sectionId){

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

    /* ==========================
       LOAD DATA FOR SECTIONS
    ========================== */

    if(sectionId==="orders-section"){

        loadOrders();

    }

    const activeLink =
document.querySelector(
    `a[data-section="${sectionId}"]`
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

        <a
href="account.html?view=orders">

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

    const params = new URLSearchParams(window.location.search);

const requestedSection = params.get("view");

if(requestedSection === "orders"){

    openSection("orders-section");

}else{

    openSection("dashboard-section");

}

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
}
</strong>`

: `Delivered between
<strong>
${formatDeliveryDate(estimatedFrom)}
and
${formatDeliveryDate(estimatedTo)}
</strong>`;

// container.innerHTML += `

// <div
//     class="order-card"
//     data-status="${order.status}"
//     data-order="${order.orderNumber}"
//     data-product="${order.items.map(item => item.name).join(" ")}">

//     <div class="order-image">

//         <img src="${firstItem.image}" alt="${firstItem.name}">

//     </div>

//     <div class="order-details">

//         <h3>${firstItem.name}</h3>

//         <p>Size: ${firstItem.size}</p>

//         <p>Order # ${order.orderNumber}</p>

//         <span class="status-badge">

//             ${order.status}

//         </span>

//      <p class="delivery-date">

// ${
//     order.status === "Completed"

//     ?

//     `Delivered on
//     <strong>
//         ${
//             order.deliveredAt
//             ? new Date(order.deliveredAt).toLocaleDateString("en-GB",{
//                 weekday:"long",
//                 day:"numeric",
//                 month:"long"
//             })
//             : ""
//         }
//     </strong>`

//     :

//     `Delivered between
//     <strong>
//         ${
//             order.estimatedFrom && order.estimatedTo

//             ?

//             `${formatDeliveryDate(order.estimatedFrom)} and ${formatDeliveryDate(order.estimatedTo)}`

//             :

//             "Calculating..."
//         }
//     </strong>`
// }

// </p>
// ${
//     extraProducts > 0

//     ?

//     `<button
//         class="more-items-btn"
//         data-order="${order.orderNumber}">

//         +${extraProducts} more product${extraProducts > 1 ? "s" : ""}

//     </button>

//     <div
//         class="more-items-list"
//         id="items-${order.orderNumber}"
//         style="display:none;">

//         <div class="hidden-products">

//     <div class="hidden-products-title">

//         Other Products In This Order

//     </div>

//     ${order.items.slice(1).map(item => `

//             <div class="mini-product">

//                 <img
//                     src="${item.image}"
//                     alt="${item.name}"
//                 >

//                 <div class="mini-product-info">

//                     <strong>${item.name}</strong>

//                     <p>${item.size}</p>

//                     <span>Qty: ${item.quantity}</span>

//                 </div>

//             </div>

//         `).join("")}
//         </div>

//     </div>`

//     :

//     ""

// }
//     </div>

//     <div class="order-side">

//         <button
//             class="view-order-btn"
//             data-order="${order.orderNumber}">

//             View Details

//             <i class="fas fa-arrow-right"></i>

//         </button>

//     </div>

// </div>

// `;
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
