import { auth, db } from "../../firebase-config.js";

import {
    updateProfile,
    updatePassword,
    signOut,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import {
    requireAdmin
}
from "../../auth-service.js";


// ==========================================
// GLOBAL VARIABLES
// ==========================================

let currentUser = null;

let currentAdminData = null;
let currentEditingStation = null;

// ==========================================
// AUTHENTICATION
// ==========================================

async function checkAdminAccess(){

    try{

        const { user } = await requireAdmin();

        currentUser = user;

        await loadAdminProfile();

        await loadStoreInformation();

        await loadPickupStations();

        await loadNotificationSettings();

    }

    catch(error){

        console.error(error);

        window.location.href = "../../login.html";

    }

}


checkAdminAccess();


// ==========================================
// PAGE INITIALISATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    initialiseSettings
);


function initialiseSettings(){

    initialiseSettingsNavigation();

    initialiseAdminProfile();

    initialiseStoreInformation();

    initialisePickupStations();

    initialiseNotificationSettings();

    initialiseSecurity();

}


// ==========================================
// SETTINGS NAVIGATION
// ==========================================

function initialiseSettingsNavigation(){

    const navItems =

        document.querySelectorAll(

            ".settings-nav-item"

        );


    const sections =

        document.querySelectorAll(

            ".settings-section"

        );


    navItems.forEach(button=>{

        button.addEventListener(

            "click",

            ()=>{

                const targetSection =

                    button.dataset.settingsSection;


                navItems.forEach(item=>{

                    item.classList.remove(

                        "active"

                    );

                });


                sections.forEach(section=>{

                    section.classList.remove(

                        "active"

                    );

                });


                button.classList.add(

                    "active"

                );


                const section =

                    document.getElementById(

                        targetSection

                    );


                if(section){

                    section.classList.add(

                        "active"

                    );

                }

            }

        );

    });

}


// ==========================================
// ADMIN PROFILE
// ==========================================

function initialiseAdminProfile(){

    const saveButton =

        document.getElementById(

            "saveAdminProfile"

        );


    if(saveButton){

        saveButton.addEventListener(

            "click",

            saveAdminProfile

        );

    }

}


async function loadAdminProfile(){

    if(!currentUser) return;


    try{

        const adminRef =

            doc(

                db,

                "admins",

                currentUser.uid

            );


        const adminSnap =

            await getDoc(

                adminRef

            );


        if(adminSnap.exists()){

            currentAdminData =

                adminSnap.data();

        }

        else{

            currentAdminData = {};

        }


        const adminName =

            currentAdminData.name ||

            currentUser.displayName ||

            "Admin";


        const adminPhone =

            currentAdminData.phone ||

            "";


        document.getElementById(

            "adminName"

        ).value = adminName;


        document.getElementById(

            "adminPhone"

        ).value = adminPhone;


        document.getElementById(

            "adminDisplayName"

        ).textContent = adminName;


        document.getElementById(

            "adminEmail"

        ).textContent =

            currentUser.email || "--";


        document.getElementById(

            "adminAvatar"

        ).textContent =

            adminName

            .charAt(0)

            .toUpperCase();

    }

    catch(error){

        console.error(

            "Failed to load admin profile:",

            error

        );

        showToast(

            "Unable to load admin profile.",

            "error"

        );

    }

}


async function saveAdminProfile(){

    if(!currentUser) return;


    const button =

        document.getElementById(

            "saveAdminProfile"

        );


    const name =

        document.getElementById(

            "adminName"

        )

        .value

        .trim();


    const phone =

        document.getElementById(

            "adminPhone"

        )

        .value

        .trim();


    if(!name){

        showToast(

            "Please enter your full name.",

            "error"

        );

        return;

    }


    button.disabled = true;


    button.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Saving...

    `;


    try{

        await setDoc(

            doc(

                db,

                "admins",

                currentUser.uid

            ),

            {

                name,

                phone,

                email: currentUser.email,

                updatedAt: serverTimestamp()

            },

            {

                merge: true

            }

        );


        if(

            currentUser.displayName !== name

        ){

            await updateProfile(

                currentUser,

                {

                    displayName: name

                }

            );

        }


        document.getElementById(

            "adminDisplayName"

        ).textContent = name;


        document.getElementById(

            "adminAvatar"

        ).textContent =

            name

            .charAt(0)

            .toUpperCase();


        showToast(

            "Admin profile updated successfully.",

            "success"

        );

    }

    catch(error){

        console.error(error);

        showToast(

            "Failed to save admin profile.",

            "error"

        );

    }

    finally{

        button.disabled = false;

        button.innerHTML = `

            <i class="fa-solid fa-floppy-disk"></i>

            Save Changes

        `;

    }

}


// ==========================================
// STORE INFORMATION
// ==========================================

function initialiseStoreInformation(){

    const button =

        document.getElementById(

            "saveStoreInformation"

        );


    if(button){

        button.addEventListener(

            "click",

            saveStoreInformation

        );

    }

}


async function loadStoreInformation(){

    try{

        const storeSnap =

            await getDoc(

                doc(

                    db,

                    "settings",

                    "store"

                )

            );


        if(!storeSnap.exists()) return;


        const store =

            storeSnap.data();


        document.getElementById(

            "storeName"

        ).value =

            store.name || "";


        document.getElementById(

            "storePhone"

        ).value =

            store.phone || "";


        document.getElementById(

            "storeEmail"

        ).value =

            store.email || "";


        document.getElementById(

            "storeLocation"

        ).value =

            store.location || "";


        document.getElementById(

            "storeDescription"

        ).value =

            store.description || "";

    }

    catch(error){

        console.error(

            "Failed to load store information:",

            error

        );

    }

}


async function saveStoreInformation(){

    const button =

        document.getElementById(

            "saveStoreInformation"

        );


    const storeData = {

        name:

            document.getElementById(

                "storeName"

            ).value.trim(),


        phone:

            document.getElementById(

                "storePhone"

            ).value.trim(),


        email:

            document.getElementById(

                "storeEmail"

            ).value.trim(),


        location:

            document.getElementById(

                "storeLocation"

            ).value.trim(),


        description:

            document.getElementById(

                "storeDescription"

            ).value.trim(),


        updatedAt:

            serverTimestamp()

    };


    if(!storeData.name){

        showToast(

            "Store name is required.",

            "error"

        );

        return;

    }


    button.disabled = true;


    button.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Saving...

    `;


    try{

        await setDoc(

            doc(

                db,

                "settings",

                "store"

            ),

            storeData,

            {

                merge: true

            }

        );


        showToast(

            "Store information saved successfully.",

            "success"

        );

    }

    catch(error){

        console.error(error);

        showToast(

            "Failed to save store information.",

            "error"

        );

    }

    finally{

        button.disabled = false;

        button.innerHTML = `

            <i class="fa-solid fa-floppy-disk"></i>

            Save Store Information

        `;

    }

}




/* ==========================================
INITIALISE ADD BUTTON
========================================== */

function initialisePickupStations(){
const addButton =
    document.getElementById("addPickupStation");

if(addButton){

    addButton.addEventListener(
        "click",
        openAddStationModal
    );

}


}

/* ==========================================
OPEN ADD STATION MODAL
========================================== */

function openAddStationModal(){

currentEditingStation = null;

document.getElementById("stationName").value = "";
document.getElementById("stationBuilding").value = "";
document.getElementById("stationPhone").value = "";
document.getElementById("stationDistrict").value = "";
document.getElementById("stationCity").value = "";
document.getElementById("stationLandmark").value = "";
document.getElementById("stationWeekdays").value = "";
document.getElementById("stationWeekend").value = "";
document.getElementById("stationStatus").value = "active";


document.getElementById(
    "pickupStationModalTitle"
).textContent = "Add Pickup Station";


document.getElementById(
    "savePickupStation"
).innerHTML = `

    <i class="fa-solid fa-plus"></i>

    Add Station

`;


document
    .getElementById("pickupStationModal")
    .classList.add("active");

}

/* ==========================================
LOAD PICKUP STATIONS
========================================== */

async function loadPickupStations(){


const container =
    document.getElementById(
        "pickupStationsSettingsList"
    );

if(!container) return;


container.innerHTML = `

    <div class="settings-loading">

        <i class="fa-solid fa-spinner fa-spin"></i>

        Loading pickup stations...

    </div>

`;


try{

    const stationRef = doc(

        db,

        "pickupStations",

        "main"

    );


    const stationSnap =

        await getDoc(stationRef);


    if(!stationSnap.exists()){

        container.innerHTML = `

            <div class="settings-card">

                <h3>No Pickup Station Found</h3>

                <p>

                    Add your first pickup station.

                </p>

                <button

                    id="createFirstStation"

                    class="settings-primary-btn">

                    <i class="fa-solid fa-plus"></i>

                    Add Pickup Station

                </button>

            </div>

        `;


        document

            .getElementById(
                "createFirstStation"
            )

            ?.addEventListener(

                "click",

                openAddStationModal

            );


        return;

    }


    const station = stationSnap.data();


    container.innerHTML = `

        <div

            class="pickup-station-card"

            data-id="main">


            <div

                class="pickup-station-card-header">


                <div

                    class="pickup-station-icon">

                    <i class="fa-solid fa-location-dot"></i>

                </div>


                <div>

                    <h3>

                        ${station.name || "Pickup Station"}

                    </h3>


                    <span

                        class="station-status

                        ${
                            station.status === "active"

                            ? "active"

                            : "inactive"

                        }">

                        ${station.status || "active"}

                    </span>

                </div>

            </div>


            <div

                class="pickup-station-details">


                <div>

                    <strong>Building</strong>

                    <span>

                        ${station.building || "--"}

                    </span>

                </div>


                <div>

                    <strong>Location</strong>

                    <span>

                        ${station.landmark || "--"},

                        ${station.city || "--"}

                    </span>

                </div>


                <div>

                    <strong>District</strong>

                    <span>

                        ${station.district || "--"}

                    </span>

                </div>


                <div>

                    <strong>Phone</strong>

                    <span>

                        ${station.phone || "--"}

                    </span>

                </div>


                <div>

                    <strong>Weekdays</strong>

                    <span>

                        ${station.weekdays || "--"}

                    </span>

                </div>


                <div>

                    <strong>Weekend</strong>

                    <span>

                        ${station.weekend || "--"}

                    </span>

                </div>


            </div>


            <div

                class="pickup-station-actions">


                <button

                    class="settings-secondary-btn"

                    id="editMainStation">


                    <i class="fa-solid fa-pen"></i>

                    Edit Station

                </button>


            </div>

        </div>

    `;


    document

        .getElementById("editMainStation")

        ?.addEventListener(

            "click",

            ()=>{

                openEditStationModal({

                    ...station,

                    id: "main"

                });

            }

        );

}


catch(error){

    console.error(

        "Failed to load pickup stations:",

        error

    );


    container.innerHTML = `

        <div class="settings-card">

            Unable to load pickup station.

        </div>

    `;

}

}

/* ==========================================
OPEN EDIT STATION MODAL
========================================== */

function openEditStationModal(station){

currentEditingStation = station;


document.getElementById(
    "stationName"
).value = station.name || "";


document.getElementById(
    "stationBuilding"
).value = station.building || "";


document.getElementById(
    "stationPhone"
).value = station.phone || "";


document.getElementById(
    "stationDistrict"
).value = station.district || "";


document.getElementById(
    "stationCity"
).value = station.city || "";


document.getElementById(
    "stationLandmark"
).value = station.landmark || "";


document.getElementById(
    "stationWeekdays"
).value = station.weekdays || "";


document.getElementById(
    "stationWeekend"
).value = station.weekend || "";


document.getElementById(
    "stationStatus"
).value = station.status || "active";


document.getElementById(
    "pickupStationModalTitle"
).textContent = "Edit Pickup Station";


document.getElementById(
    "savePickupStation"
).innerHTML = `

    <i class="fa-solid fa-floppy-disk"></i>

    Save Changes

`;


document

    .getElementById(
        "pickupStationModal"
    )

    .classList.add("active");


}

/* ==========================================
SAVE PICKUP STATION
========================================== */

async function savePickupStation(){
const saveButton =

    document.getElementById(
        "savePickupStation"
    );


const stationData = {

    name:
        document
            .getElementById("stationName")
            .value
            .trim(),

    building:
        document
            .getElementById("stationBuilding")
            .value
            .trim(),

    phone:
        document
            .getElementById("stationPhone")
            .value
            .trim(),

    district:
        document
            .getElementById("stationDistrict")
            .value
            .trim(),

    city:
        document
            .getElementById("stationCity")
            .value
            .trim(),

    landmark:
        document
            .getElementById("stationLandmark")
            .value
            .trim(),

    weekdays:
        document
            .getElementById("stationWeekdays")
            .value
            .trim(),

    weekend:
        document
            .getElementById("stationWeekend")
            .value
            .trim(),

    status:
        document
            .getElementById("stationStatus")
            .value

};


if(!stationData.name){

    showToast(

        "Station name is required.",

        "error"

    );

    return;

}


const originalButtonContent =

    saveButton.innerHTML;


saveButton.disabled = true;


saveButton.innerHTML = `

    <i class="fa-solid fa-spinner fa-spin"></i>

    Saving...

`;


try{


    /* ==================================
       EDIT EXISTING STATION
    ================================== */

    if(currentEditingStation){

        await updateDoc(

            doc(

                db,

                "pickupStations",

                currentEditingStation.id

            ),

            stationData

        );


        showToast(

            "Pickup station updated successfully.",

            "success"

        );

    }


    /* ==================================
       ADD NEW STATION
    ================================== */

    else{

        await setDoc(

            doc(

                db,

                "pickupStations",

                "main"

            ),

            {

                ...stationData,

                createdAt:

                    serverTimestamp()

            }

        );


        showToast(

            "Pickup station added successfully.",

            "success"

        );

    }


    closePickupStationModal();


    await loadPickupStations();

}


catch(error){

    console.error(

        "Failed to save pickup station:",

        error

    );


    showToast(

        "Unable to save pickup station.",

        "error"

    );

}


finally{

    saveButton.disabled = false;


    saveButton.innerHTML =

        originalButtonContent;

}

}

/* ==========================================
CLOSE MODAL
========================================== */

function closePickupStationModal(){

const modal =

    document.getElementById(

        "pickupStationModal"

    );


if(modal){

    modal.classList.remove("active");

}

currentEditingStation = null;

}

/* ==========================================
MODAL BUTTONS
========================================== */

document

.getElementById(

    "savePickupStation"

)

?.addEventListener(

    "click",

    savePickupStation

);

document
.getElementById(

    "closePickupStationModal"

)

?.addEventListener(

    "click",

    closePickupStationModal

);


document
.getElementById(

    "cancelPickupStationModal"

)

?.addEventListener(

    "click",

    closePickupStationModal

);


document
.getElementById(

    "pickupStationModalOverlay"

)

?.addEventListener(

    "click",

    closePickupStationModal

);

// ==========================================
// NOTIFICATION SETTINGS
// ==========================================

function initialiseNotificationSettings(){

    const button =

        document.getElementById(

            "saveNotificationSettings"

        );


    if(button){

        button.addEventListener(

            "click",

            saveNotificationSettings

        );

    }

}


async function loadNotificationSettings(){

    try{

        const snap =

            await getDoc(

                doc(

                    db,

                    "settings",

                    "notifications"

                )

            );


        if(!snap.exists()) return;


        const settings =

            snap.data();


        document.getElementById(

            "orderNotificationsEnabled"

        ).checked =

            settings.orderNotificationsEnabled !== false;


        document.getElementById(

            "activityTrackingEnabled"

        ).checked =

            settings.activityTrackingEnabled !== false;

    }

    catch(error){

        console.error(error);

    }

}


async function saveNotificationSettings(){

    const button =

        document.getElementById(

            "saveNotificationSettings"

        );


    const settings = {

        orderNotificationsEnabled:

            document.getElementById(

                "orderNotificationsEnabled"

            ).checked,


        activityTrackingEnabled:

            document.getElementById(

                "activityTrackingEnabled"

            ).checked,


        updatedAt:

            serverTimestamp()

    };


    button.disabled = true;


    button.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Saving...

    `;


    try{

        await setDoc(

            doc(

                db,

                "settings",

                "notifications"

            ),

            settings,

            {

                merge: true

            }

        );


        showToast(

            "Notification settings saved.",

            "success"

        );

    }

    catch(error){

        console.error(error);

        showToast(

            "Failed to save notification settings.",

            "error"

        );

    }

    finally{

        button.disabled = false;

        button.innerHTML = `

            <i class="fa-solid fa-floppy-disk"></i>

            Save Notification Settings

        `;

    }

}


// ==========================================
// SECURITY
// ==========================================
function initialiseSecurity(){

    const changePasswordButton =
        document.getElementById(
            "changePasswordBtn"
        );

    const logoutButton =
        document.getElementById(
            "settingsLogoutBtn"
        );


    if(changePasswordButton){

        changePasswordButton.addEventListener(

            "click",

            openChangePasswordModal

        );

    }


    if(logoutButton){

        logoutButton.addEventListener(

            "click",

            logoutAdmin

        );

    }


    document

        .getElementById(
            "saveNewPassword"
        )

        ?.addEventListener(

            "click",

            changeAdminPassword

        );


    document

        .getElementById(
            "closeChangePasswordModal"
        )

        ?.addEventListener(

            "click",

            closeChangePasswordModal

        );


    document

        .getElementById(
            "cancelChangePassword"
        )

        ?.addEventListener(

            "click",

            closeChangePasswordModal

        );


    document

        .getElementById(
            "changePasswordModalOverlay"
        )

        ?.addEventListener(

            "click",

            closeChangePasswordModal

        );

}
function openChangePasswordModal(){

    const modal =

        document.getElementById(

            "changePasswordModal"

        );


    if(!modal) return;


    document.getElementById(

        "currentPassword"

    ).value = "";


    document.getElementById(

        "newPassword"

    ).value = "";


    document.getElementById(

        "confirmPassword"

    ).value = "";


    modal.classList.add(

        "active"

    );

}
function closeChangePasswordModal(){

    const modal =

        document.getElementById(

            "changePasswordModal"

        );


    if(modal){

        modal.classList.remove(

            "active"

        );

    }

}
async function changeAdminPassword(){

    if(!currentUser) return;


    const currentPassword =

        document.getElementById(

            "currentPassword"

        ).value;


    const newPassword =

        document.getElementById(

            "newPassword"

        ).value;


    const confirmPassword =

        document.getElementById(

            "confirmPassword"

        ).value;


    if(!currentPassword){

        showToast(

            "Enter your current password.",

            "error"

        );

        return;

    }


    if(!newPassword){

        showToast(

            "Enter a new password.",

            "error"

        );

        return;

    }


    if(newPassword.length < 6){

        showToast(

            "Password must be at least 6 characters.",

            "error"

        );

        return;

    }


    if(newPassword !== confirmPassword){

        showToast(

            "New passwords do not match.",

            "error"

        );

        return;

    }


    const saveButton =

        document.getElementById(

            "saveNewPassword"

        );


    const originalContent =

        saveButton.innerHTML;


    saveButton.disabled = true;


    saveButton.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Updating Password...

    `;


    try{

        const credential =

            EmailAuthProvider.credential(

                currentUser.email,

                currentPassword

            );


        await reauthenticateWithCredential(

            currentUser,

            credential

        );


        await updatePassword(

            currentUser,

            newPassword

        );


        closeChangePasswordModal();


        showToast(

            "Password changed successfully.",

            "success"

        );

    }


    catch(error){

        console.error(error);


        if(

            error.code ===

            "auth/invalid-credential"

            ||

            error.code ===

            "auth/wrong-password"

        ){

            showToast(

                "Current password is incorrect.",

                "error"

            );

        }

        else{

            showToast(

                "Unable to change password.",

                "error"

            );

        }

    }


    finally{

        saveButton.disabled = false;


        saveButton.innerHTML =

            originalContent;

    }

}
document

    .querySelectorAll(

        ".toggle-password"

    )

    .forEach(button=>{

        button.addEventListener(

            "click",

            ()=>{

                const input =

                    document.getElementById(

                        button.dataset.target

                    );


                const icon =

                    button.querySelector(

                        "i"

                    );


                if(

                    input.type ===

                    "password"

                ){

                    input.type =

                        "text";


                    icon.classList.remove(

                        "fa-eye"

                    );


                    icon.classList.add(

                        "fa-eye-slash"

                    );

                }

                else{

                    input.type =

                        "password";


                    icon.classList.remove(

                        "fa-eye-slash"

                    );


                    icon.classList.add(

                        "fa-eye"

                    );

                }

            }

        );

    });


async function logoutAdmin(){

    try{

        await signOut(auth);

        window.location.href =

            "login.html";

    }

    catch(error){

        console.error(error);

        showToast(

            "Unable to sign out.",

            "error"

        );

    }

}


// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(

    message,

    type = "success"

){

    const toast =

        document.createElement(

            "div"

        );


    toast.className =

        `settings-toast ${type}`;


    toast.innerHTML = `

        <i class="fa-solid

            ${type === "success"

                ? "fa-circle-check"

                : "fa-circle-exclamation"}

        "></i>

        <span>

            ${message}

        </span>

    `;


    document.body.appendChild(

        toast

    );


    setTimeout(

        ()=>{

            toast.classList.add(

                "show"

            );

        },

        10

    );


    setTimeout(

        ()=>{

            toast.remove();

        },

        4000

    );

}
/* ===========================
LOGOUT
=========================== */

document.getElementById("logoutBtn")

.onclick=async()=>{

await signOut(auth);

window.location.href="../../login.html";

};