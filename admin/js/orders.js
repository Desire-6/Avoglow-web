import { auth, db } from "../../firebase-config.js";

import {
    onAuthStateChanged,
    signOut
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    collection,
    query,
    orderBy,
    getDoc,
    doc,
    onSnapshot
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

let allOrders = [];
let filteredOrders = [];
let currentPage = 1;

const ordersPerPage = 10;

let currentStatus = "all";

/* ===========================
STATUS BADGES
=========================== */

function getStatusBadge(status){

    switch(status){

        case "Pending":
            return `<span class="badge pending">Pending</span>`;

        case "Processing":
            return `<span class="badge processing">Processing</span>`;

        case "Ready for Pickup":
            return `<span class="badge ready">Ready</span>`;

        case "Out for Delivery":
            return `<span class="badge delivery">Delivery</span>`;

        case "Delivered":
        case "Completed":
            return `<span class="badge completed">Delivered</span>`;

        case "Cancelled":
            return `<span class="badge cancelled">Cancelled</span>`;

        default:
            return `<span class="badge">${status}</span>`;
    }

}

/* ===========================
AUTH
=========================== */

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        location.href="login.html";
        return;

    }

    const admin = await getDoc(doc(db,"admins",user.uid));

    if(!admin.exists()){

        location.href="login.html";
        return;

    }

    loadOrders();

});

/* ===========================
LOAD ORDERS
=========================== */

function loadOrders(){

    const q = query(

        collection(db,"orders"),

        orderBy("createdAt","desc")

    );

    onSnapshot(q,(snapshot)=>{

        allOrders=[];

        snapshot.forEach(doc=>{

            allOrders.push({

                id:doc.id,

                ...doc.data()

            });

        });

        applyFilters();

        updateCounters();

    });

}

/* ===========================
APPLY FILTERS
=========================== */

function applyFilters(){

    const keyword =
    document.getElementById("searchInput")?.value.toLowerCase() || "";

    const payment =
    document.getElementById("paymentFilter")?.value || "All";

    const statusFilter =
document.getElementById("statusFilter").value;

    const sort =
    document.getElementById("sortFilter")?.value || "Latest";

    filteredOrders=[...allOrders];

    /* STATUS */

    if(currentStatus!="all"){

        filteredOrders=
        filteredOrders.filter(o=>o.status===currentStatus);

    }

    /* SEARCH */

    if(keyword){

        filteredOrders=
        filteredOrders.filter(order=>{

            return(

                order.orderNumber.toLowerCase().includes(keyword)

                ||

                order.customer.name.toLowerCase().includes(keyword)

            );

        });

    }

    /* PAYMENT */

    if(payment!="All"){

        filteredOrders=
        filteredOrders.filter(o=>o.payment.method===payment);

    }

    /* STATUS */

if(statusFilter!="All"){

filteredOrders=
filteredOrders.filter(

o=>o.status===statusFilter

);

}
/* ===========================
DATE FILTER
=========================== */

const dateFilter =
document.getElementById("dateFilter").value;

if(dateFilter){

    const today = new Date();

    filteredOrders = filteredOrders.filter(order=>{

        if(!order.createdAt) return false;

        const orderDate = order.createdAt.toDate();

        switch(dateFilter){

            case "today":

                return orderDate.toDateString()===today.toDateString();

            case "week":

                const weekAgo = new Date();

                weekAgo.setDate(today.getDate()-7);

                return orderDate>=weekAgo;

            case "month":

                return orderDate.getMonth()===today.getMonth()

                &&

                orderDate.getFullYear()===today.getFullYear();

        }

    });

}
    /* SORT */

    switch(sort){

        case "Latest":

            filteredOrders.sort((a,b)=>

                b.createdAt.seconds-a.createdAt.seconds

            );

        break;

        case "Oldest":

            filteredOrders.sort((a,b)=>

                a.createdAt.seconds-b.createdAt.seconds

            );

        break;

        case "Highest":

            filteredOrders.sort((a,b)=>

                b.total-a.total

            );

        break;

        case "Lowest":

            filteredOrders.sort((a,b)=>

                a.total-b.total

            );

        break;

    }

    currentPage=1;

renderOrders();

renderPagination();

}

/* ===========================
RENDER
=========================== */

function renderOrders(){

    const tbody=document.getElementById("ordersTableBody");

    tbody.innerHTML="";

    const start = (currentPage-1)*ordersPerPage;

const end = start+ordersPerPage;

const pageOrders = filteredOrders.slice(start,end);

pageOrders.forEach(order=>{

        tbody.innerHTML+=`

<tr>

<td>

<input

type="checkbox"

class="order-checkbox"

data-id="${order.orderNumber}">

</td>
<td>${order.orderNumber}</td>

<td>${order.customer.name}</td>


<td>${order.items.length}</td>

<td>${order.payment.method}</td>

<td>

${getStatusBadge(order.status)}

</td>

<td>

UGX ${order.total.toLocaleString()}

</td>

<td>

${order.createdAt?.toDate().toLocaleDateString()}

</td>

<td>

<button
class="view-order"
data-id="${order.orderNumber}">

<span>View</span>

</button>

</td>

</tr>

`;

    });

}
function renderPagination(){

const totalPages =

Math.ceil(filteredOrders.length/ordersPerPage);

const pageNumbers =

document.getElementById("pageNumbers");

pageNumbers.innerHTML="";

for(let i=1;i<=totalPages;i++){

pageNumbers.innerHTML += `

<button

class="page-btn ${i===currentPage?"active":""}"

data-page="${i}">

${i}

</button>

`;

}

}

/* ===========================
COUNTERS
=========================== */

function updateCounters(){

document.getElementById("countAll").textContent=
allOrders.length;

document.getElementById("countPending").textContent=
allOrders.filter(o=>o.status=="Pending").length;

document.getElementById("countProcessing").textContent=
allOrders.filter(o=>o.status=="Processing").length;

document.getElementById("countReady").textContent=
allOrders.filter(o=>o.status=="Ready for Pickup").length;

document.getElementById("countDelivery").textContent=
allOrders.filter(o=>o.status=="Out for Delivery").length;

document.getElementById("countCompleted").textContent=
allOrders.filter(o=>

o.status=="Completed"

||

o.status=="Delivered"

).length;

document.getElementById("countCancelled").textContent=
allOrders.filter(o=>o.status=="Cancelled").length;

}

/* ===========================
STATUS TABS
=========================== */

document.querySelectorAll(".tab")

.forEach(tab=>{

tab.onclick=()=>{

document.querySelectorAll(".tab")

.forEach(t=>t.classList.remove("active"));

tab.classList.add("active");

currentStatus=tab.dataset.status;

applyFilters();

};

});

/* ===========================
SEARCH
=========================== */

document.getElementById("searchInput")
?.addEventListener("input",applyFilters);

/* ===========================
FILTERS
=========================== */

document.getElementById("paymentFilter")
?.addEventListener("change",applyFilters);

document.getElementById("statusFilter")
?.addEventListener("change",applyFilters);
document.getElementById("dateFilter")

.addEventListener("change",applyFilters);

document.getElementById("sortFilter")
?.addEventListener("change",applyFilters);

/* ===========================
VIEW BUTTON
=========================== */

document.addEventListener("click",(e)=>{

const btn=e.target.closest(".view-order");

if(!btn)return;

const orderNumber=btn.dataset.id;

location.href=

`order-details.html?id=${orderNumber}`;

});
document.getElementById("refreshOrders").onclick=()=>{

location.reload();

}

/* ===========================
LOGOUT
=========================== */

document.getElementById("logoutBtn")

.onclick=async()=>{

await signOut(auth);

location.href="login.html";

};
document.addEventListener("click",(e)=>{

const btn=e.target.closest(".page-btn");

if(!btn)return;

currentPage=Number(btn.dataset.page);

renderOrders();

renderPagination();

});
document.getElementById("prevPage")

.onclick=()=>{

if(currentPage>1){

currentPage--;

renderOrders();

renderPagination();

}

}
document.getElementById("nextPage")

.onclick=()=>{

const totalPages=

Math.ceil(filteredOrders.length/ordersPerPage);

if(currentPage<totalPages){

currentPage++;

renderOrders();

renderPagination();

}

}
function updateBulkBar(){

const selected=

document.querySelectorAll(".order-checkbox:checked");

document.getElementById("selectedCount")

.textContent=

`${selected.length} Selected`;

document.getElementById("bulkActions")

.style.display=

selected.length>0?"flex":"none";

}
document.addEventListener("change",(e)=>{

if(e.target.classList.contains("order-checkbox")){

updateBulkBar();

}

});
document.getElementById("selectAll")

.addEventListener("change",(e)=>{

document

.querySelectorAll(".order-checkbox")

.forEach(box=>{

box.checked=e.target.checked;

});

updateBulkBar();

});
document.addEventListener("click",(e)=>{

const btn=e.target.closest(".view-order");

if(!btn)return;

const orderNumber=btn.dataset.id;

window.location.href=

`order-details.html?order=${encodeURIComponent(orderNumber)}`;

});
function getSelectedOrders(){

const selected=[];

document

.querySelectorAll(".order-checkbox:checked")

.forEach(box=>{

selected.push(box.dataset.id);

});

return selected;

}
document.getElementById("bulkStatus")

.onclick=()=>{

const ids=getSelectedOrders();

if(ids.length===0){

alert("Select orders first.");

return;

}

alert(ids.length+" orders selected.");

}
document.getElementById("bulkDelete")

.onclick=()=>{

const ids=getSelectedOrders();

if(ids.length===0){

alert("Select orders first.");

return;

}

if(confirm("Delete selected orders?")){

console.log(ids);

}

}