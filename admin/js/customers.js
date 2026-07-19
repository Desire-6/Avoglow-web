import {auth, db } from "../../firebase-config.js";
import {
    signOut
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    requireAdmin
} from "../../auth-service.js";

import{

collection,

getDocs,
query,
updateDoc,
doc,
where,

orderBy,
addDoc,
serverTimestamp

}

from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import {

    createAdminActivity

} from "../../adminActivity.js";
/* ============================================
GLOBAL VARIABLES
============================================ */
let currentCustomer = null;
let allCustomers = [];
let customerOrdersMap = {};

let filteredCustomers = [];

let currentPage = 1;

const customersPerPage = 10;
/* ==========================================
CUSTOMER DRAWER
========================================== */

const drawer =
    document.getElementById("customerDrawer");

const overlay =
    document.getElementById("drawerOverlay");
/* ============================================
CHECK ADMIN LOGIN
============================================ */

async function checkAdminAccess(){

    try{

        await requireAdmin();

        initialiseCustomers();

    }

    catch(error){

        console.error(error);

        window.location.href="../../login.html";

    }

}


checkAdminAccess();
/* ============================================
INITIALISE
============================================ */

function initialiseCustomers() {

    loadCustomers();
    initialiseDrawer();

    initialiseCustomerFilters();
    document

.getElementById(

"toggleCustomerStatus"

)

.addEventListener(

"click",

toggleCustomerStatus

);
document
.getElementById("notifyCustomer")
.addEventListener("click", openNotificationModal);
document
.getElementById("closeNotification")
.addEventListener(
    "click",
    closeNotificationModal
);

document
.getElementById("cancelNotification")
.addEventListener(
    "click",
    closeNotificationModal
);
document
.getElementById("notificationModal")
.addEventListener("click",(event)=>{

    if(event.target.id==="notificationModal"){

        closeNotificationModal();

    }

});
document.addEventListener("keydown",(event)=>{

    if(event.key==="Escape"){

        closeNotificationModal();

    }

});
document
    .getElementById("sendNotification")
    .addEventListener(
        "click",
        sendCustomerNotification
    );

}
/* ============================================
LOAD CUSTOMERS
============================================ */

async function loadCustomers(){

    customerOrdersMap = {};

    /* -------------------------
       LOAD ALL ORDERS
    -------------------------- */

    const ordersSnapshot = await getDocs(
        collection(db,"orders")
    );

    ordersSnapshot.forEach(orderDoc=>{

        const order = orderDoc.data();

        const uid = order.userId;

        if(!customerOrdersMap[uid]){

            customerOrdersMap[uid]={

                orders:0,

                spent:0

            };

        }

        customerOrdersMap[uid].orders++;

        customerOrdersMap[uid].spent +=
            Number(order.total || 0);

    });

    /* -------------------------
       LOAD USERS
    -------------------------- */

    const usersSnapshot =
        await getDocs(collection(db,"users"));

    allCustomers=[];

    for(const userDoc of usersSnapshot.docs){

        const data = userDoc.data();

const user = {
    id: userDoc.id,
    ...data,
    status: data.status || "Active"
};

        try{

            const addressRef = doc(

                db,

                "users",

                userDoc.id,

                "profile",

                "address"

            );

            const addressSnap =
                await getDoc(addressRef);

            if(addressSnap.exists()){

                Object.assign(

                    user,

                    addressSnap.data()

                );

            }

        }

        catch(error){

            console.log(error);

        }

        const stats =

            customerOrdersMap[user.id] ||

            {

                orders:0,

                spent:0

            };

        user.orders = stats.orders;

        user.spent = stats.spent;

        allCustomers.push(user);

    }

    filteredCustomers=[...allCustomers];

    populateDistricts();

    updateStatistics();

    renderCustomers();

}
/* ============================================
STATISTICS
============================================ */

function updateStatistics(){

    document.getElementById("totalCustomers").textContent =
        allCustomers.length;

    const customersWithOrders =

        allCustomers.filter(

            customer=>customer.orders>0

        ).length;

    document.getElementById("customersWithOrders").textContent =
        customersWithOrders;

    const month = new Date().getMonth();

    const year = new Date().getFullYear();

    const newCustomers =

        allCustomers.filter(customer=>{

            if(!customer.createdAt) return false;

            const date =
                customer.createdAt.toDate();

            return(

                date.getMonth()===month &&

                date.getFullYear()===year

            );

        });

    document.getElementById("newCustomers").textContent =
        newCustomers.length;

    const revenue =

        allCustomers.reduce(

            (sum,customer)=>

                sum+(customer.spent||0),

            0

        );

    document.getElementById("customerRevenue").textContent =

        "UGX "+revenue.toLocaleString();

}
/* ==========================================
RENDER CUSTOMERS
========================================== */

function renderCustomers(){

    const tbody = document.getElementById("customersTableBody");

    const empty = document.getElementById("emptyCustomers");

    tbody.innerHTML = "";

    if(filteredCustomers.length===0){

        empty.classList.remove("hidden");

        return;

    }

    empty.classList.add("hidden");

    const start=(currentPage-1)*customersPerPage;

    const end=start+customersPerPage;

    const customers=

        filteredCustomers.slice(start,end);

    customers.forEach(customer=>{

        tbody.innerHTML+=createCustomerRow(customer);

    });

    renderPagination();

    attachCustomerEvents();

}
/* ==========================================
CUSTOMER ROW
========================================== */
function createCustomerRow(customer) {

    const fullName =
        customer.fullName ||
        customer.name ||
        "Unknown Customer";

    const initials = fullName
        .split(" ")
        .map(word => word[0])
        .join("")
        .substring(0,2)
        .toUpperCase();

    const joined = customer.createdAt
        ? customer.createdAt.toDate().toLocaleDateString()
        : "--";

    return `

<tr>

<td>

<div class="customer-cell">

<div class="customer-avatar">

${initials}

</div>

<div class="customer-details">

<h3>${fullName}</h3>

<span>${customer.email}</span>

</div>

</div>

</td>

<td>

${customer.phone || "--"}

</td>

<td>

${customer.district || "--"}

</td>

<td>

${customer.orders}

</td>

<td>

UGX ${(customer.spent || 0).toLocaleString()}

</td>

<td>

${joined}

</td>

<td>

<span class="status-pill active">

<span class="status-dot"></span>

Active

</span>

</td>

<td>

<button
class="view-btn"
data-id="${customer.id}">

View

</button>

</td>

</tr>

`;

}
/* ==========================================
CUSTOMER EVENTS
========================================== */

function attachCustomerEvents(){

    document

    .querySelectorAll(".view-btn")

    .forEach(button=>{

        button.onclick=()=>{

            const id=

                button.dataset.id;

            openCustomerDrawer(id);

        };

    });

}
/* ==========================================
OPEN CUSTOMER DRAWER
========================================== */

async function openCustomerDrawer(customerId){

    const customer =

        allCustomers.find(

            customer=>customer.id===customerId

        );

    if(!customer) return;

    drawer.classList.add("active");

    overlay.classList.add("active");

    populateDrawer(customer);

    await loadCustomerOrders(customerId);
    currentCustomer = customer;
    const blockBtn =

document.getElementById(

"toggleCustomerStatus"

);

if(customer.status==="Blocked"){

    blockBtn.innerHTML=`

<i class="fa-solid fa-lock-open"></i>

Unblock Customer

`;

}

else{

    blockBtn.innerHTML=`

<i class="fa-solid fa-user-lock"></i>

Block Customer

`;

}

}
/* ==========================================
POPULATE DRAWER
========================================== */

function populateDrawer(customer){

    const fullName =

        customer.fullName ||

        customer.name ||

        "Unknown Customer";

    document.getElementById(

        "drawerAvatar"

    ).textContent =

        fullName.charAt(0).toUpperCase();

    document.getElementById(

        "drawerName"

    ).textContent =

        fullName;

    document.getElementById(

        "drawerEmail"

    ).textContent =

        customer.email || "--";

    document.getElementById(

        "drawerPhone"

    ).textContent =

        customer.phone || "--";

    document.getElementById(

        "drawerDistrict"

    ).textContent =

        customer.district || "--";

    document.getElementById(

        "drawerCity"

    ).textContent =

        customer.city || "--";

    document.getElementById(

        "drawerAddress"

    ).textContent =

        customer.address || "--";

    document.getElementById(

        "drawerNotes"

    ).textContent =

        customer.notes || "--";

    document.getElementById(

        "drawerOrders"

    ).textContent =

        customer.orders;

    document.getElementById(

        "drawerSpent"

    ).textContent =

        "UGX "+customer.spent.toLocaleString();

    document.getElementById(

        "drawerJoined"

    ).textContent =

        customer.createdAt

        ?

        customer.createdAt

        .toDate()

        .toLocaleDateString()

        :

        "--";

}
/* ============================================
PAGINATION
============================================ */

function renderPagination(){

    const pagination =

        document.getElementById(

            "customerPagination"

        );

    if(!pagination) return;

    const pages =

        Math.ceil(

            filteredCustomers.length /

            customersPerPage

        );

    pagination.innerHTML = `

<button

${currentPage===1?"disabled":""}

id="previousCustomers">

Previous

</button>

<span>

Page ${currentPage} of ${pages || 1}

</span>

<button

${currentPage===pages || pages===0?"disabled":""}

id="nextCustomers">

Next

</button>

`;

    const previous =

        document.getElementById(

            "previousCustomers"

        );

    const next =

        document.getElementById(

            "nextCustomers"

        );

    previous.onclick = ()=>{

        currentPage--;

        renderCustomers();

    };

    next.onclick = ()=>{

        currentPage++;

        renderCustomers();

    };

}
function populateDistricts() {

    const select = document.getElementById("districtFilter");

    if(!select) return;

    select.innerHTML = `<option value="">All Districts</option>`;

    const districts = [

        ...new Set(

            allCustomers

                .map(customer => customer.district)

                .filter(Boolean)

        )

    ];

    districts.sort();

    districts.forEach(district=>{

        select.innerHTML += `

        <option value="${district}">

            ${district}

        </option>

        `;

    });

}
function initialiseCustomerFilters(){

    const search = document.getElementById("searchCustomer");
    const district = document.getElementById("districtFilter");
    const status = document.getElementById("statusFilter");
    const sort = document.getElementById("sortCustomers");
    const order =
    document.getElementById("orderFilter");

if(order){

    order.addEventListener(

        "change",

        applyCustomerFilters

    );

}

    if(search){

        search.addEventListener("input",applyCustomerFilters);

    }

    if(district){

        district.addEventListener("change",applyCustomerFilters);

    }

    if(status){

        status.addEventListener("change",applyCustomerFilters);

    }

    if(sort){

        sort.addEventListener("change",applyCustomerFilters);

    }

}
function applyCustomerFilters() {

    const search =

        document

            .getElementById("searchCustomer")

            .value

            .toLowerCase()

            .trim();

    const district =

    document

        .getElementById("districtFilter")

        .value;

const status =

    document

        .getElementById("statusFilter")

        .value;

const order =

    document

        .getElementById("orderFilter")

        .value;

const sort =

    document

        .getElementById("sortCustomers")

        .value;

    filteredCustomers = [...allCustomers];

    // Search

    if(search){

        filteredCustomers = filteredCustomers.filter(customer=>{

            return (

                (customer.fullName || customer.name || "")

                    .toLowerCase()

                    .includes(search)

                ||

                (customer.email || "")

                    .toLowerCase()

                    .includes(search)

                ||

                (customer.phone || "")

                    .toLowerCase()

                    .includes(search)

            );

        });

    }

    // District

    if(district){

        filteredCustomers = filteredCustomers.filter(customer=>

            customer.district === district

        );

    }
    if(status){

    filteredCustomers =

        filteredCustomers.filter(customer=>{

            const customerStatus =

                customer.status || "Active";

            return customerStatus===status;

        });

}
switch(order){

    case "WithOrders":

        filteredCustomers =

            filteredCustomers.filter(

                customer=>customer.orders>0

            );

        break;

    case "WithoutOrders":

        filteredCustomers =

            filteredCustomers.filter(

                customer=>customer.orders===0

            );

        break;

}

    // Sorting

    switch(sort){

       case "Newest":

    filteredCustomers.sort((a,b)=>{

        const first =

            a.createdAt?.seconds || 0;

        const second =

            b.createdAt?.seconds || 0;

        return second-first;

    });

break;

case "Oldest":

    filteredCustomers.sort((a,b)=>{

        const first =

            a.createdAt?.seconds || 0;

        const second =

            b.createdAt?.seconds || 0;

        return first-second;

    });

break;

        case "AZ":

            filteredCustomers.sort(

                (a,b)=>

                    (a.fullName||a.name)

                    .localeCompare(

                        b.fullName||b.name

                    )

            );

            break;

        case "ZA":

            filteredCustomers.sort(

                (a,b)=>

                    (b.fullName||b.name)

                    .localeCompare(

                        a.fullName||a.name

                    )

            );

            break;

    }

    currentPage = 1;

    renderCustomers();

}
/* ==========================================
CLOSE DRAWER
========================================== */

function closeCustomerDrawer(){

    drawer.classList.remove("active");

    overlay.classList.remove("active");

}
/* ==========================================
INITIALISE DRAWER
========================================== */

function initialiseDrawer(){

    document

        .getElementById("closeDrawer")

        .onclick = closeCustomerDrawer;

    overlay.onclick = closeCustomerDrawer;

}
/* ==========================================
LOAD CUSTOMER ORDERS
========================================== */

async function loadCustomerOrders(customerId) {

    const container = document.getElementById("drawerOrdersList");

    container.innerHTML = "<p>Loading orders...</p>";

    const q = query(
        collection(db, "orders"),
        where("userId", "==", customerId)
    );

    const snapshot = await getDocs(q);

    container.innerHTML = "";

    if (snapshot.empty) {

        container.innerHTML = `
            <p>No orders yet.</p>
        `;

        document.getElementById("drawerLastOrder").textContent = "--";
        document.getElementById("drawerPickupName").textContent = "--";
        return;
    }

    let latestOrder = null;
    let latestDate = null;

    snapshot.forEach(orderDoc => {

        const order = orderDoc.data();

        // Find latest order
        if (order.createdAt) {

            const date = order.createdAt.toDate();

            if (!latestDate || date > latestDate) {

                latestDate = date;
                latestOrder = order;

            }

        }

        const items = order.items || [];

        const itemsHtml = items.map(item => `

            <div class="drawer-item">

                <img
                    src="../${item.image}"
                    alt="${item.name}"
                    class="drawer-item-image">

                <div class="drawer-item-info">

                    <strong>${item.name}</strong>

                    <span>

                        Qty ${item.quantity}

                    </span>

                </div>

                <div class="drawer-item-price">

                    UGX ${Number(item.price).toLocaleString()}

                </div>

            </div>

        `).join("");

        container.innerHTML += `

        <div class="order-card">

            <div class="order-header"
                 onclick="toggleOrder(this)">

                <div>

                    <h4>${order.orderNumber}</h4>

                    <span>

                        ${
                            order.createdAt
                                ? order.createdAt.toDate().toLocaleDateString()
                                : "--"
                        }

                    </span>

                </div>

                <div class="order-header-right">

                    <span class="order-status ${order.status.toLowerCase()}">

                        ${order.status}

                    </span>

                    <i class="fa-solid fa-chevron-down"></i>

                </div>

            </div>

            <div class="order-content">

                <div class="drawer-items">

                    ${itemsHtml}

                </div>

                <div class="order-summary">

                    <div>

                        <label>Payment Method</label>

                        <p>${order.payment?.method || "--"}</p>

                    </div>

                    <div>

                        <label>Payment Phone</label>

                        <p>${order.payment?.phone || "--"}</p>

                    </div>

                    <div>

                        <label>Payment Status</label>

                        <p>${order?.paymentStatus || "--"}</p>

                    </div>

                    <div>

                        <label>Delivery Method</label>

                        <p>

                            ${
                                order.delivery?.method === "home"
                                    ? "Home Delivery"
                                    : "Pickup Station"
                            }

                        </p>

                    </div>

                    <div>

                        <label>Delivery Fee</label>

                        <p>

                            UGX ${Number(order?.deliveryFee || 0).toLocaleString()}

                        </p>

                    </div>

                    <div>

                        <label>Estimated Delivery</label>

                        <p>

                            ${order?.estimatedFrom || "--"}

                            -

                            ${order?.estimatedTo || "--"}

                        </p>

                    </div>

                    <div>

                        <label>Total</label>

                        <strong>

                            UGX ${Number(order.total || 0).toLocaleString()}

                        </strong>

                    </div>

                </div>

            </div>

        </div>

        `;

    });

    // Update latest order summary
    if (latestOrder) {

        document.getElementById("drawerLastOrder").textContent =
            latestOrder.orderNumber || "--";

    }

    document.getElementById(

        "drawerLastOrder"

    ).textContent =

        latestDate

        ?

        latestDate.toLocaleDateString()

        :

        "--";

}
window.toggleOrder=function(header){

    const card=

        header.parentElement;

    card.classList.toggle("open");

}
async function toggleCustomerStatus(){

    if(!currentCustomer) return;


    const oldStatus =
        currentCustomer.status;


    const newStatus =

        oldStatus === "Blocked"

        ? "Active"

        : "Blocked";


    const customerName =

        currentCustomer.fullName ||

        currentCustomer.name ||

        "Unknown Customer";


    try{


        // ==================================
        // 1. UPDATE CUSTOMER STATUS
        // ==================================

        await updateDoc(

            doc(

                db,

                "users",

                currentCustomer.id

            ),

            {

                status: newStatus

            }

        );


        // ==================================
        // 2. CREATE ADMIN ACTIVITY
        // ==================================

        await createAdminActivity({

            type: "customer",

            title:

                newStatus === "Blocked"

                ? "Customer Blocked"

                : "Customer Unblocked",


            description:

                newStatus === "Blocked"

                ? `Admin blocked customer ${customerName}.`

                : `Admin unblocked customer ${customerName}.`,


            userName: "Admin",

            userId:

                currentCustomer.id,


            metadata: {

                customerName:

                    customerName,


                customerEmail:

                    currentCustomer.email || "",


                previousStatus:

                    oldStatus,


                newStatus:

                    newStatus,


                action:

                    newStatus === "Blocked"

                    ? "blocked"

                    : "unblocked"

            }

        });


        // ==================================
        // 3. UPDATE LOCAL DATA
        // ==================================

        currentCustomer.status =
            newStatus;


        const button =

            document.getElementById(

                "toggleCustomerStatus"

            );


        if(newStatus === "Blocked"){

            button.innerHTML = `

                <i class="fa-solid fa-lock-open"></i>

                Unblock Customer

            `;


            showToast(

                "Customer blocked.",

                "success"

            );

        }

        else{

            button.innerHTML = `

                <i class="fa-solid fa-user-lock"></i>

                Block Customer

            `;


            showToast(

                "Customer unblocked.",

                "success"

            );

        }


        loadCustomers();


    }


    catch(error){

        console.error(

            "Customer status update failed:",

            error

        );


        showToast(

            "Unable to update customer.",

            "error"

        );

    }

}
function showToast(title,message,type="success"){

const toast=document.createElement("div");

toast.className=`toast ${type}`;

toast.innerHTML=`

<i class="fas fa-circle-check"></i>

<div>

<h4>${title}</h4>

<p>${message}</p>

</div>

`;

document

.getElementById("toastContainer")

.appendChild(toast);

setTimeout(()=>{

toast.remove();

},4000);

}
function openNotificationModal(){

    if(!currentCustomer) return;

    document
    .getElementById("notificationModal")
    .classList.add("active");

    document
    .getElementById("notificationTitle")
    .focus();

}
function closeNotificationModal(){

    document
    .getElementById("notificationModal")
    .classList.remove("active");

    clearNotificationForm();

}
function clearNotificationForm(){

    document
    .getElementById("notificationType")
    .selectedIndex = 0;

    document
    .getElementById("notificationTitle")
    .value = "";

    document
    .getElementById("notificationMessage")
    .value = "";

}
async function sendCustomerNotification(){

    if(!currentCustomer){

        showToast(
            "No customer selected.",
            "error"
        );

        return;

    }

    const type =

        document

        .getElementById(

            "notificationType"

        )

        .value;


    const title =

        document

        .getElementById(

            "notificationTitle"

        )

        .value

        .trim();


    const message =

        document

        .getElementById(

            "notificationMessage"

        )

        .value

        .trim();


    // ==========================================
    // VALIDATION
    // ==========================================

    if(!title){

        showToast(

            "Please enter a notification title.",

            "error"

        );

        document

        .getElementById(

            "notificationTitle"

        )

        .focus();

        return;

    }


    if(!message){

        showToast(

            "Please enter a message.",

            "error"

        );

        document

        .getElementById(

            "notificationMessage"

        )

        .focus();

        return;

    }


    const sendButton =

        document

        .getElementById(

            "sendNotification"

        );


    // Prevent duplicate submissions

    if(sendButton.disabled) return;


    sendButton.disabled = true;


    sendButton.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Sending...

    `;


    try{


        // ==========================================
        // 1. SAVE NOTIFICATION FOR THE CUSTOMER
        // ==========================================

        await addDoc(

            collection(

                db,

                "notifications"

            ),

            {

                userId:

                    currentCustomer.id,

                title:

                    title,

                message:

                    message,

                type:

                    "admin",

                category:

                    type,

                isRead:

                    false,

                createdAt:

                    serverTimestamp(),

                sentBy:

                    auth.currentUser.uid

            }

        );


        // ==========================================
        // 2. RECORD ADMIN ACTIVITY
        // ==========================================

        const customerName =

            currentCustomer.profile?.fullName ||

            currentCustomer.name ||

            currentCustomer.email ||

            "Unknown Customer";


       await createAdminActivity({

    type: "notification",

    title: "Customer Notification Sent",

    description:

        `A notification was sent to ${
            currentCustomer.fullName ||
            currentCustomer.name ||
            currentCustomer.email
        }.`,


    userName:

        currentCustomer.fullName ||

        currentCustomer.name ||

        currentCustomer.email,


    userId:

        currentCustomer.id,


    metadata: {

        notificationTitle: title,

        notificationCategory: type

    }

});


        // ==========================================
        // 3. SUCCESS MESSAGE
        // ==========================================

        showToast(

            "Notification sent successfully.",

            "success"

        );


        closeNotificationModal();


    }


    catch(error){

        console.error(

            "Notification error:",

            error

        );


        showToast(

            "Failed to send notification.",

            "error"

        );

    }


    finally{

        sendButton.disabled = false;


        sendButton.innerHTML = `

            Send Notification

        `;

    }

}
/* ===========================
LOGOUT
=========================== */

document.getElementById("logoutBtn")

.onclick=async()=>{

await signOut(auth);

 window.location.href = "../login.html";

};