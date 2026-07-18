import { auth, db } from "../../firebase-config.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

/* ==========================================
   ELEMENTS
========================================== */

const form = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("adminEmail");
const passwordInput = document.getElementById("adminPassword");

const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const togglePassword = document.getElementById("togglePassword");

/* ==========================================
   CHECK IF ALREADY LOGGED IN
========================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) return;

    try {

        const adminRef = doc(db, "admins", user.uid);

        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {

            await signOut(auth);
            return;

        }

        const admin = adminSnap.data();

        if (!admin.active) {

            await signOut(auth);
            return;

        }

        window.location.href = "dashboard.html";

    }

    catch (error) {

        console.error(error);

    }

});

/* ==========================================
   LOGIN
========================================== */

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    loginError.textContent = "";

    loginBtn.disabled = true;
    loginBtn.classList.add("loading");

    loginBtn.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        Signing In...
    `;

    try {

        const credential = await signInWithEmailAndPassword(

            auth,
            emailInput.value.trim(),
            passwordInput.value

        );

        const uid = credential.user.uid;

        const adminRef = doc(db, "admins", uid);

        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {

            await signOut(auth);

            throw new Error("You are not an administrator.");

        }

        const admin = adminSnap.data();

        if (!admin.active) {

            await signOut(auth);

            throw new Error("Administrator account has been disabled.");

        }

        window.location.href = "dashboard.html";

    }

    catch (error) {

        console.error(error);

        loginError.textContent = error.message || "Invalid email or password.";

        loginBtn.disabled = false;

        loginBtn.classList.remove("loading");

        loginBtn.innerHTML = `
            <i class="fas fa-right-to-bracket"></i>
            Sign In
        `;

    }

});

/* ==========================================
   SHOW/HIDE PASSWORD
========================================== */

togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.classList.replace(

            "fa-eye",
            "fa-eye-slash"

        );

    }

    else {

        passwordInput.type = "password";

        togglePassword.classList.replace(

            "fa-eye-slash",
            "fa-eye"

        );

    }

});