import { db } from "../../firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


let allActivities = [];

let filteredActivities = [];

let currentPage = 1;

const activitiesPerPage = 10;


// ==========================================
// INITIALISE ACTIVITY PAGE
// ==========================================

document.addEventListener(

    "DOMContentLoaded",

    initialiseActivity

);


async function initialiseActivity(){

    await loadActivities();

    initialiseActivityFilters();

}

async function refreshActivity(){

    const button =
        document.getElementById(
            "refreshActivity"
        );

    if(!button) return;


    // Prevent multiple clicks

    if(button.disabled) return;


    button.disabled = true;


    const originalHTML =
        button.innerHTML;


    button.innerHTML = `

        <i class="fa-solid fa-rotate fa-spin"></i>

        Refreshing...

    `;


    try{

        await loadActivities();


    }

    catch(error){

        console.error(

            "Refresh activity error:",

            error

        );

    }


    finally{

        setTimeout(

            () => {

                button.disabled = false;

                button.innerHTML =

                    originalHTML;

            },

            500

        );

    }

}
document

    .getElementById(

        "refreshActivity"

    )

    ?.addEventListener(

        "click",

        refreshActivity

    );
// ==========================================
// LOAD ACTIVITIES
// ==========================================

async function loadActivities(){

    console.log(
        "loadActivities() is running"
    );

    const container =
        document.getElementById(
            "activityList"
        );

    if(!container){

        console.error(
            "activityList was not found"
        );

        return;

    }

    const loading =
        document.getElementById(
            "activityLoading"
        );

    if(loading){

        loading.classList.remove(
            "hidden"
        );

    }

    try{

        const activitiesQuery = query(

            collection(
                db,
                "adminActivities"
            ),

            orderBy(
                "createdAt",
                "desc"
            )

        );

        const snapshot =
            await getDocs(
                activitiesQuery
            );

        console.log(
            "Activities found:",
            snapshot.size
        );

        allActivities = [];

        snapshot.forEach(docSnap => {

            console.log(
                "Activity document:",
                docSnap.id,
                docSnap.data()
            );

            allActivities.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });

        filteredActivities =
            [...allActivities];

        if(loading){

            loading.classList.add(
                "hidden"
            );

        }

        renderActivities();

    }

    catch(error){

        console.error(
            "Failed to load activities:",
            error
        );

        if(loading){

            loading.classList.add(
                "hidden"
            );

        }

        container.innerHTML += `

            <div class="activity-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Unable to load activities
                </h3>

                <p>
                    ${error.message}
                </p>

            </div>

        `;

    }

}
// ==========================================
// RENDER ACTIVITIES
// ==========================================

function renderActivities(){

    const container =
        document.getElementById("activityList");

    const emptyState =
        document.getElementById("activityEmpty");

    const activityCount =
        document.getElementById("activityCount");

    if(!container) return;
    const countElement =
    document.getElementById(
        "activityCount"
    );

if(countElement){

    const count =
        filteredActivities.length;

    countElement.textContent =

        count === 1

        ? "1 activity"

        : `${count} activities`;

}

    container.innerHTML = "";

    if(activityCount){

        activityCount.textContent =
            `${filteredActivities.length} activit${
                filteredActivities.length === 1
                ? "y"
                : "ies"
            }`;

    }

    if(filteredActivities.length === 0){

        container.innerHTML = `

            <div class="activity-empty">

                <div class="activity-empty-icon">

                    <i class="fa-solid fa-clock-rotate-left"></i>

                </div>

                <h3>

                    No Activity Found

                </h3>

                <p>

                    Important actions and events will appear here.

                </p>

            </div>

        `;

        const pagination =
            document.getElementById(
                "activityPagination"
            );

        if(pagination){

            pagination.innerHTML = "";

        }

        return;

    }

    const start =
        (currentPage - 1) *
        activitiesPerPage;

    const end =
        start +
        activitiesPerPage;

    const activities =
        filteredActivities.slice(
            start,
            end
        );

    activities.forEach(activity => {

        container.innerHTML +=
            createActivityCard(activity);

    });

    renderPagination();

}
// ==========================================
// CREATE ACTIVITY CARD
// ==========================================

function createActivityCard(activity){

    const iconData =

        getActivityIcon(

            activity.type

        );


    return `

        <article

            class="activity-item"

            data-id="${activity.id}"

        >


            <div

                class="activity-icon

                ${iconData.className}"

            >

                <i

                    class="${iconData.icon}"

                ></i>

            </div>


            <div class="activity-content">


                <div class="activity-top">


                    <div>


                        <h3>

                            ${activity.title ||

                            "Admin Activity"}

                        </h3>


                        <span

                            class="activity-time"

                        >

                            ${formatActivityTime(

                                activity.createdAt

                            )}

                        </span>

                    </div>


                    <span

                        class="activity-type"

                    >

                        ${activity.type ||

                        "system"}

                    </span>


                </div>


                <p>

                    ${activity.description ||

                    "No description available."}

                </p>


                ${createActivityMeta(

                    activity

                )}


            </div>


            <button

                class="activity-view-btn"

                data-id="${activity.id}"

            >

                View

            </button>


        </article>

    `;

}


// ==========================================
// ACTIVITY META INFORMATION
// ==========================================

function createActivityMeta(activity){

    let html = "";


    if(activity.userName){

        html += `

            <span>

                <i class="fa-solid fa-user"></i>

                ${activity.userName}

            </span>

        `;

    }


    if(activity.orderNumber){

        html += `

            <span>

                <i class="fa-solid fa-receipt"></i>

                ${activity.orderNumber}

            </span>

        `;

    }


    if(activity.productName){

        html += `

            <span>

                <i class="fa-solid fa-box"></i>

                ${activity.productName}

            </span>

        `;

    }


    if(!html) return "";


    return `

        <div class="activity-meta">

            ${html}

        </div>

    `;

}


// ==========================================
// ACTIVITY ICONS
// ==========================================

function getActivityIcon(type){

    switch(type){

        case "notification":

            return {

                icon:

                    "fa-solid fa-paper-plane",

                className:

                    "notification"

            };


        case "order":

            return {

                icon:

                    "fa-solid fa-cart-shopping",

                className:

                    "order"

            };


        case "customer":

            return {

                icon:

                    "fa-solid fa-user",

                className:

                    "customer"

            };


        case "product":

            return {

                icon:

                    "fa-solid fa-box",

                className:

                    "product"

            };


        case "system":

            return {

                icon:

                    "fa-solid fa-gear",

                className:

                    "system"

            };


        default:

            return {

                icon:

                    "fa-solid fa-clock-rotate-left",

                className:

                    "default"

            };

    }

}


// ==========================================
// FORMAT ACTIVITY TIME
// ==========================================

function formatActivityTime(timestamp){

    if(!timestamp) return "Just now";


    const date =

        timestamp.toDate();


    const now =

        new Date();


    const difference =

        now - date;


    const minutes =

        Math.floor(

            difference /

            (1000 * 60)

        );


    if(minutes < 1){

        return "Just now";

    }


    if(minutes < 60){

        return `${minutes} minute${

            minutes === 1

            ? ""

            : "s"

        } ago`;

    }


    const hours =

        Math.floor(

            minutes /

            60

        );


    if(hours < 24){

        return `${hours} hour${

            hours === 1

            ? ""

            : "s"

        } ago`;

    }


    const days =

        Math.floor(

            hours /

            24

        );


    if(days < 7){

        return `${days} day${

            days === 1

            ? ""

            : "s"

        } ago`;

    }


    return date.toLocaleString(

        "en-GB",

        {

            day: "numeric",

            month: "short",

            year: "numeric",

            hour: "2-digit",

            minute: "2-digit"

        }

    );

}


// ==========================================
// FILTERS
// ==========================================

function initialiseActivityFilters(){

    const search =

        document.getElementById(

            "activitySearch"

        );


    const typeFilter =

        document.getElementById(

            "activityTypeFilter"

        );


    const dateFilter =

        document.getElementById(

            "activityDateFilter"

        );


    const clearButton =

        document.getElementById(

            "clearActivityFilters"

        );


    search?.addEventListener(

        "input",

        applyActivityFilters

    );


    typeFilter?.addEventListener(

        "change",

        applyActivityFilters

    );


    dateFilter?.addEventListener(

        "change",

        applyActivityFilters

    );


    clearButton?.addEventListener(

        "click",

        () => {

            if(search)

                search.value = "";


            if(typeFilter)

                typeFilter.value = "";


            if(dateFilter)

                dateFilter.value = "";


            applyActivityFilters();

        }

    );

}


function applyActivityFilters(){

    const search =

        document

        .getElementById(

            "activitySearch"

        )

        ?.value

        .toLowerCase()

        .trim() || "";


    const type =

        document

        .getElementById(

            "activityTypeFilter"

        )

        ?.value || "";


    const dateFilter =

        document

        .getElementById(

            "activityDateFilter"

        )

        ?.value || "";


    const now = new Date();


    filteredActivities =

        allActivities.filter(

            activity => {


                const matchesSearch =

                    !search ||

                    (

                        activity.title ||

                        ""

                    )

                    .toLowerCase()

                    .includes(search)


                    ||

                    (

                        activity.description ||

                        ""

                    )

                    .toLowerCase()

                    .includes(search)


                    ||

                    (

                        activity.userName ||

                        ""

                    )

                    .toLowerCase()

                    .includes(search);


                const matchesType =

                    !type ||

                    activity.type === type;


                let matchesDate = true;


                if(

                    dateFilter &&

                    activity.createdAt

                ){

                    const date =

                        activity.createdAt.toDate();


                    const startOfToday =

                        new Date();


                    startOfToday.setHours(

                        0,

                        0,

                        0,

                        0

                    );


                    if(

                        dateFilter ===

                        "today"

                    ){

                        matchesDate =

                            date >=

                            startOfToday;

                    }


                    else if(

                        dateFilter ===

                        "yesterday"

                    ){

                        const yesterday =

                            new Date(

                                startOfToday

                            );


                        yesterday.setDate(

                            yesterday.getDate() - 1

                        );


                        matchesDate =

                            date >= yesterday &&

                            date < startOfToday;

                    }


                    else if(

                        dateFilter === "7"

                    ){

                        const sevenDaysAgo =

                            new Date();

                        sevenDaysAgo.setDate(

                            sevenDaysAgo.getDate() - 7

                        );


                        matchesDate =

                            date >= sevenDaysAgo;

                    }


                    else if(

                        dateFilter === "30"

                    ){

                        const thirtyDaysAgo =

                            new Date();

                        thirtyDaysAgo.setDate(

                            thirtyDaysAgo.getDate() - 30

                        );


                        matchesDate =

                            date >= thirtyDaysAgo;

                    }

                }


                return (

                    matchesSearch &&

                    matchesType &&

                    matchesDate

                );

            }

        );


    currentPage = 1;


    renderActivities();

}


// ==========================================
// PAGINATION
// ==========================================

function renderPagination(){

    const pagination =

        document.getElementById(

            "activityPagination"

        );


    if(!pagination) return;


    const pages =

        Math.ceil(

            filteredActivities.length /

            activitiesPerPage

        );


    pagination.innerHTML = `

        <button

            id="previousActivity"

            ${currentPage === 1

                ? "disabled"

                : ""}

        >

            Previous

        </button>


        <span>

            Page ${currentPage}

            of ${pages || 1}

        </span>


        <button

            id="nextActivity"

            ${currentPage === pages ||

            pages === 0

                ? "disabled"

                : ""}

        >

            Next

        </button>

    `;


    document

    .getElementById(

        "previousActivity"

    )

    ?.addEventListener(

        "click",

        () => {

            currentPage--;

            renderActivities();

        }

    );


    document

    .getElementById(

        "nextActivity"

    )

    ?.addEventListener(

        "click",

        () => {

            currentPage++;

            renderActivities();

        }

    );

}
document.addEventListener(

    "click",

    event => {


        const button =

            event.target.closest(

                ".activity-view-btn"

            );


        if(!button) return;


        const activityId =

            button.dataset.id;


        const activity =

            allActivities.find(

                item =>

                    item.id === activityId

            );


        if(!activity) return;


        openActivityDetails(

            activity

        );

    }

);
function openActivityDetails(activity){

    const panel =
        document.getElementById(
            "activityDetailsPanel"
        );

    if(!panel) return;


    // -------------------------------
    // ICON
    // -------------------------------

    const iconData =
        getActivityIcon(
            activity.type
        );


    const iconContainer =
        document.getElementById(
            "activityDetailsIcon"
        );

    if(iconContainer){

        iconContainer.className =
            `activity-details-icon ${iconData.className}`;

        iconContainer.innerHTML = `

            <i class="${iconData.icon}"></i>

        `;

    }


    // -------------------------------
    // TYPE
    // -------------------------------

    const typeElement =
        document.getElementById(
            "activityDetailsType"
        );

    if(typeElement){

        typeElement.textContent =
            activity.type || "Activity";

    }


    // -------------------------------
    // TITLE
    // -------------------------------

    const titleElement =
        document.getElementById(
            "activityDetailsTitle"
        );

    if(titleElement){

        titleElement.textContent =
            activity.title ||
            "Activity Details";

    }


    // -------------------------------
    // DESCRIPTION
    // -------------------------------

    const descriptionElement =
        document.getElementById(
            "activityDetailsDescription"
        );

    if(descriptionElement){

        descriptionElement.textContent =
            activity.description ||
            "No description available.";

    }


    // -------------------------------
    // PERFORMED BY
    // -------------------------------

    const userElement =
        document.getElementById(
            "activityDetailsUser"
        );

    if(userElement){

        userElement.textContent =
            activity.userName ||
            "Admin";

    }


    // -------------------------------
    // DATE & TIME
    // -------------------------------

    const dateElement =
        document.getElementById(
            "activityDetailsDate"
        );

    if(dateElement){

        if(activity.createdAt){

            dateElement.textContent =
                activity.createdAt
                .toDate()
                .toLocaleString(

                    "en-GB",

                    {

                        weekday: "long",

                        day: "numeric",

                        month: "long",

                        year: "numeric",

                        hour: "2-digit",

                        minute: "2-digit"

                    }

                );

        }else{

            dateElement.textContent =
                "Just now";

        }

    }


    // -------------------------------
    // RELATED ITEM
    // -------------------------------

    const relatedElement =
        document.getElementById(
            "activityDetailsRelated"
        );

    if(relatedElement){

        let related = "None";

        if(activity.userName){

            related =
                activity.userName;

        }

        if(activity.orderNumber){

            related =
                activity.orderNumber;

        }

        if(activity.productName){

            related =
                activity.productName;

        }

        relatedElement.textContent =
            related;

    }


    // -------------------------------
    // ADDITIONAL INFORMATION
    // -------------------------------

    const metadataElement =
        document.getElementById(
            "activityDetailsMetadata"
        );

    if(metadataElement){

        const metadata =
            activity.metadata || {};

        const metadataEntries =
            Object.entries(metadata);


        if(metadataEntries.length === 0){

            metadataElement.textContent =
                "No additional information.";

        }else{

            metadataElement.innerHTML =

                metadataEntries

                .map(([key, value]) => `

                    <div class="metadata-row">

                        <span>

                            ${formatMetadataKey(key)}

                        </span>

                        <strong>

                            ${value}

                        </strong>

                    </div>

                `)

                .join("");

        }

    }


    // -------------------------------
    // SHOW DRAWER
    // -------------------------------

    panel.classList.remove(
        "hidden"
    );

}
function formatActivityType(type){

    if(!type){

        return "Activity";

    }


    const names = {

        order: "Order",

        customer: "Customer",

        product: "Product",

        payment: "Payment",

        notification: "Notification",

        system: "System"

    };


    return names[type]

        || type.charAt(0).toUpperCase()

        + type.slice(1);

}
function formatFullActivityDate(timestamp){

    const date =

        timestamp.toDate();


    return date.toLocaleString(

        "en-GB",

        {

            weekday: "long",

            day: "numeric",

            month: "long",

            year: "numeric",

            hour: "2-digit",

            minute: "2-digit"

        }

    );

}
function formatMetadataKey(key){

    return key

        .replace(

            /([A-Z])/g,

            " $1"

        )

        .replace(

            /^./,

            letter =>

                letter.toUpperCase()

        );

}
const closeActivityDetails =

    document.getElementById(

        "closeActivityDetails"

    );


if(closeActivityDetails){

    closeActivityDetails.addEventListener(

        "click",

        () => {

            document

                .getElementById(

                    "activityDetailsPanel"

                )

                .classList.add(

                    "hidden"

                );

        }

    );

}
document.addEventListener(

    "click",

    event => {


        const panel =

            document.getElementById(

                "activityDetailsPanel"

            );


        if(!panel) return;


        if(

            !panel.classList.contains(

                "hidden"

            )

            &&

            !event.target.closest(

                ".activity-details-panel"

            )

            &&

            !event.target.closest(

                ".activity-view-btn"

            )

        ){

            panel.classList.add(

                "hidden"

            );

        }

    }

);
/* ===========================
LOGOUT
=========================== */

document.getElementById("logoutBtn")

.onclick=async()=>{

await signOut(auth);

location.href="login.html";

};