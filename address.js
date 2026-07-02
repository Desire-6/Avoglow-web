import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

/* ==========================
   ELEMENTS
========================== */

const modal = document.getElementById("addressModal");

const form = document.getElementById("addressForm");

const addBtn = document.getElementById("addAddressBtn");

const editBtn = document.getElementById("changeAddressBtn");

const closeBtn = document.getElementById("closeModal");

const cancelBtn = document.getElementById("cancelAddress");

const savedCard = document.getElementById("saved-address-card");

const savedName = document.getElementById("saved-name");

const savedLocation = document.getElementById("saved-location");

const savedPhone = document.getElementById("saved-phone");

/* ==========================
   OPEN MODAL
========================== */

function openModal(){

    modal.classList.add("show");

}

function closeModal(){

    modal.classList.remove("show");

}

addBtn?.addEventListener("click", openModal);

editBtn?.addEventListener("click", openModal);

closeBtn?.addEventListener("click", closeModal);

cancelBtn?.addEventListener("click", closeModal);

window.addEventListener("click",(e)=>{

    if(e.target===modal){

        closeModal();

    }

});

/* ==========================
   RESET FORM
========================== */

function resetAddressForm(){

    form.reset();

}

/* ==========================
   LOAD ADDRESS
========================== */

async function loadAddress(user){

    try{

        const addressRef = doc(

            db,

            "users",

            user.uid,

            "profile",

            "address"

        );

        const snapshot = await getDoc(addressRef);

        if(!snapshot.exists()){

            savedName.textContent = "";

            savedLocation.textContent =
            "You haven't added a delivery address yet.";

            savedPhone.textContent = "";

            addBtn.style.display = "inline-flex";

            editBtn.style.display = "none";

            return;

        }

        const data = snapshot.data();

        savedName.textContent =
        data.fullName;

        savedLocation.innerHTML = `

            ${data.address}<br>

            ${data.city}, ${data.district}

        `;

        savedPhone.innerHTML = `

            <i class="fa-solid fa-phone"></i>

            ${data.phone}

        `;

        addBtn.style.display = "none";

        editBtn.style.display = "inline-flex";

        document.getElementById("fullName").value =
        data.fullName;

        document.getElementById("phone").value =
        data.phone;

        document.getElementById("district").value =
        data.district;

        document.getElementById("city").value =
        data.city;

        document.getElementById("address").value =
        data.address;

        document.getElementById("notes").value =
        data.notes || "";

    }

    catch(error){

        console.error(error);

    }

}

/* ==========================
   SAVE ADDRESS
========================== */

form.addEventListener("submit", async(e)=>{

    e.preventDefault();

    const user = auth.currentUser;

    if(!user){

        alert("Please login first.");

        return;

    }

    const fullName =
    document.getElementById("fullName");

    const phone =
    document.getElementById("phone");

    const district =
    document.getElementById("district");

    const city =
    document.getElementById("city");

    const address =
    document.getElementById("address");

    const notes =
    document.getElementById("notes");

    if(

        !fullName.value.trim() ||

        !phone.value.trim() ||

        !district.value ||

        !city.value.trim() ||

        !address.value.trim()

    ){

        alert("Please complete all required fields.");

        return;

    }

    try{

        await setDoc(

            doc(

                db,

                "users",

                user.uid,

                "profile",

                "address"

            ),

            {

                fullName: fullName.value,

                phone: phone.value,

                district: district.value,

                city: city.value,

                address: address.value,

                notes: notes.value,

                updatedAt: serverTimestamp()

            }

        );

        closeModal();

        await loadAddress(user);

        resetAddressForm();

    }

    catch(error){

        console.error(error);

        alert("Failed to save address.");

    }

});

/* ==========================
   AUTH
========================== */

onAuthStateChanged(auth,(user)=>{

    if(user){

        loadAddress(user);

    }

    else{

        savedName.textContent = "";

        savedLocation.textContent =
        "Please login to continue.";

        savedPhone.textContent = "";

        addBtn.style.display = "none";

        editBtn.style.display = "none";

    }

});