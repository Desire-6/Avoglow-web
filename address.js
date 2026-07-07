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

/* ============================
   ELEMENTS
============================ */

const form = document.getElementById("addressForm");

const addBtn = document.getElementById("addAddressBtn");
const editBtn = document.getElementById("changeAddressBtn");
const cancelBtn = document.getElementById("cancelAddress");

const addressEditor = document.getElementById("addressEditor");
const savedCard = document.getElementById("saved-address-card");

const savedName = document.getElementById("saved-name");
const savedLocation = document.getElementById("saved-location");
const savedPhone = document.getElementById("saved-phone");

/* ============================
   SHOW / HIDE FORM
============================ */

function showEditor() {

    savedCard.style.display = "none";
    addressEditor.style.display = "block";

}

function hideEditor() {

    addressEditor.style.display = "none";
    savedCard.style.display = "block";

}

addBtn?.addEventListener("click", showEditor);
editBtn?.addEventListener("click", showEditor);

cancelBtn?.addEventListener("click", hideEditor);

/* ============================
   RESET FORM
============================ */

function resetAddressForm() {

    form.reset();

}

/* ============================
   LOAD ADDRESS
============================ */

async function loadAddress(user) {

    try {

        const ref = doc(
            db,
            "users",
            user.uid,
            "profile",
            "address"
        );

        const snap = await getDoc(ref);

        if (!snap.exists()) {

            savedName.textContent = "No address saved";

            savedLocation.textContent =
                "You haven't added an address yet.";

            savedPhone.textContent = "";

            addBtn.style.display = "inline-flex";
            editBtn.style.display = "none";

            addressEditor.style.display = "none";
            savedCard.style.display = "block";

            return;

        }

        const data = snap.data();

        savedName.textContent = data.fullName;

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

        document.getElementById("fullName").value = data.fullName;
        document.getElementById("phone").value = data.phone;
        document.getElementById("district").value = data.district;
        document.getElementById("city").value = data.city;
        document.getElementById("address").value = data.address;
        document.getElementById("notes").value = data.notes || "";

        hideEditor();

    }

    catch (err) {

        console.error(err);

    }

}

/* ============================
   SAVE ADDRESS
============================ */

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {

        alert("Please login first.");
        return;

    }

    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const district = document.getElementById("district").value;
    const city = document.getElementById("city").value.trim();
    const address = document.getElementById("address").value.trim();
    const notes = document.getElementById("notes").value.trim();

    if (!fullName || !phone || !district || !city || !address) {

        alert("Please complete all required fields.");
        return;

    }

    try {

        await setDoc(

            doc(
                db,
                "users",
                user.uid,
                "profile",
                "address"
            ),

            {

                fullName,
                phone,
                district,
                city,
                address,
                notes,
                updatedAt: serverTimestamp()

            }

        );

        await loadAddress(user);

    }

    catch (err) {

        console.error(err);

        alert("Failed to save address.");

    }

});

/* ============================
   INIT
============================ */

onAuthStateChanged(auth, (user) => {

    if (user) {

        loadAddress(user);

    }

});