import { auth, db } from "../../firebase-config.js";

import {

collection,
getDocs,
query,
orderBy,
doc,
updateDoc

}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import {

    requireAdmin

} from "../../auth-service.js";
/* ============================================
CHECK ADMIN LOGIN
============================================ */

async function checkAdminAccess(){

    try{

        await requireAdmin();

        initialiseMessages();

    }

    catch(error){

        console.error(error);

        window.location.href="../../login.html";

    }

}

checkAdminAccess();
/* ============================================
INITIALISE PAGE
============================================ */

async function initialiseMessages(){

    await loadMessages();

}

const table =
document.getElementById("messagesTable");

const searchInput =
document.getElementById("searchMessages");

const filterSelect =
document.getElementById("messageFilter");

let messages = [];
let currentPage = 1;

const rowsPerPage = 10;

searchInput.addEventListener("input",()=>{

    currentPage = 1;

    renderMessages();

});

filterSelect.addEventListener("change",()=>{

    currentPage = 1;

    renderMessages();

});
document
.getElementById("prevPage")
.addEventListener("click",()=>{

    if(currentPage>1){

        currentPage--;

        renderMessages();

    }

});

document
.getElementById("nextPage")
.addEventListener("click",()=>{

    currentPage++;

    renderMessages();

});

async function loadMessages(){

    const q = query(

        collection(db,"contactMessages"),

        orderBy("createdAt","desc")

    );

    const snapshot = await getDocs(q);

    messages = [];

    snapshot.forEach(doc=>{

        messages.push({

            id:doc.id,

            ...doc.data()

        });

    });

    renderMessages();

}

function renderMessages(){

    table.innerHTML = "";

    const tableWrapper =
    document.getElementById("messagesTableWrapper");

    const emptyState =
    document.getElementById("emptyMessages");

    const search =
    searchInput.value
    .toLowerCase()
    .trim();

    const filter =
    filterSelect.value;

    const filteredMessages = messages.filter(message=>{

        const matchesSearch =

            message.fullName
            .toLowerCase()
            .includes(search)

            ||

            message.email
            .toLowerCase()
            .includes(search)

            ||

            message.messageNumber
            .toLowerCase()
            .includes(search);

        const matchesFilter =

            filter === "all"

            ||

            message.status === filter;

        return matchesSearch && matchesFilter;

    });

    // No messages found

    if(filteredMessages.length === 0){

        tableWrapper.style.display = "none";

        emptyState.style.display = "flex";
        document.getElementById("messagesPagination").style.display = "none";

        return;

    }

    // Messages found

    tableWrapper.style.display = "table";

    emptyState.style.display = "none";

  const totalPages = Math.ceil(

    filteredMessages.length / rowsPerPage

);

if(currentPage > totalPages){

    currentPage = totalPages || 1;

}

const start =

(currentPage - 1) * rowsPerPage;

const end =

start + rowsPerPage;

const pageMessages =

filteredMessages.slice(start,end);

pageMessages.forEach(message=>{

    table.innerHTML += createRow(message);

});

renderPagination(totalPages);

}
function renderPagination(totalPages){

    const pagination =

    document.getElementById("messagesPagination");

    if(totalPages <= 1){

        pagination.style.display = "none";

        return;

    }

    pagination.style.display = "flex";

    document.getElementById("pageInfo").textContent =

        `Page ${currentPage} of ${totalPages}`;

    document.getElementById("prevPage").disabled =

        currentPage === 1;

    document.getElementById("nextPage").disabled =

        currentPage === totalPages;

}

function createRow(message){

    let badge = "status-new";

    switch(message.status){

        case "Read":

            badge = "status-read";

            break;

        default:

            badge = "status-new";

    }

    let date = "";

    if(message.createdAt){

        date =

        message.createdAt
        .toDate()
        .toLocaleDateString(

            "en-GB",

            {

                day:"2-digit",

                month:"short",

                year:"numeric"

            }

        );

    }

    return `

    <tr>

        <td>

            ${message.messageNumber}

        </td>

        <td>

            <strong>${message.fullName}</strong><br>

            <small>

                ${message.email}

            </small>

        </td>

        <td>

            ${message.inquiryType}

        </td>

        <td>

            ${date}

        </td>

        <td>

            <span class="message-status ${badge}">

                ${message.status}

            </span>

        </td>

        <td>

            <button

            class="view-message"

            data-id="${message.id}">

                View

            </button>

        </td>

    </tr>

    `;

}
document.addEventListener("click", async (e)=>{

    if(!e.target.closest(".view-message")) return;

    const id =

    e.target.closest(".view-message").dataset.id;

    const message =

    messages.find(m=>m.id===id);

    if(!message) return;

    document.getElementById("viewMessageNumber").textContent =
    message.messageNumber;

    document.getElementById("viewCustomerName").textContent =
    message.fullName;

    document.getElementById("viewCustomerEmail").textContent =
    message.email;

    document.getElementById("viewCustomerPhone").textContent =
    message.phone;

    document.getElementById("viewInquiryType").textContent =
    message.inquiryType;

    document.getElementById("viewMessageText").textContent =
    message.message;

    if(message.createdAt){

      const date = message.createdAt.toDate();

document.getElementById("viewMessageDate").textContent =
date.toLocaleDateString("en-GB",{
    weekday:"long",
    day:"numeric",
    month:"long",
    year:"numeric"
}) +
" • " +
date.toLocaleTimeString("en-GB",{
    hour:"2-digit",
    minute:"2-digit"
});

    }

    document
    .getElementById("messageModal")
    .classList.add("show");

    // Automatically mark as Read

    if(message.status==="New"){

        await updateDoc(

            doc(db,"contactMessages",id),

            {

                status:"Read"

            }

        );

        message.status="Read";

        renderMessages();

    }

});
document
.getElementById("closeMessageModal")
.addEventListener("click",()=>{
    const modal =
document.getElementById("messageModal");

modal.addEventListener("click",(e)=>{

    if(e.target === modal){

        modal.classList.remove("show");

    }

});

    document
    .getElementById("messageModal")
    .classList.remove("show");

});
