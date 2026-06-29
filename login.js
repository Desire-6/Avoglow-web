import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

/* ==========================
   ELEMENTS
========================== */

const form =
document.getElementById("login-form");

const loginBtn =
document.getElementById("login-btn");

const forgotPassword =
document.getElementById("forgot-password");

/* ==========================
   TOAST
========================== */

function showToast(message,type="success"){

    const toast =
    document.getElementById("toast");

    if(type==="success"){

        toast.style.background="#0f9d58";

        toast.innerHTML=`
            <i class="fas fa-check-circle"></i>
            ${message}
        `;

    }

    else{

        toast.style.background="#d32f2f";

        toast.innerHTML=`
            <i class="fas fa-circle-exclamation"></i>
            ${message}
        `;

    }

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },3000);

}

/* ==========================
   ERRORS
========================== */

function clearErrors(){

    document
    .querySelectorAll(".error-message")
    .forEach(error=>{

        error.textContent="";

    });

    document
    .querySelectorAll("input")
    .forEach(input=>{

        input.classList.remove("error");

    });

}

function showError(id,message){

    document
    .getElementById(id)
    .classList.add("error");

    document
    .getElementById(id+"-error")
    .textContent=message;

}

/* ==========================
   SHOW PASSWORD
========================== */

document
.querySelectorAll(".toggle-password")
.forEach(icon=>{

    icon.addEventListener("click",()=>{

        const input=
        icon.previousElementSibling;

        if(input.type==="password"){

            input.type="text";

            icon.classList.replace(
                "fa-eye",
                "fa-eye-slash"
            );

        }

        else{

            input.type="password";

            icon.classList.replace(
                "fa-eye-slash",
                "fa-eye"
            );

        }

    });

});

/* ==========================
   LOGIN
========================== */

form.addEventListener("submit",async(e)=>{

    e.preventDefault();

    clearErrors();

    const email=
    document.getElementById("email").value.trim();

    const password=
    document.getElementById("password").value;

    const remember=
    document.getElementById("remember-me").checked;

    let valid=true;

    if(email===""){

        showError("email","Please enter your email.");

        valid=false;

    }

    if(password===""){

        showError("password","Please enter your password.");

        valid=false;

    }

    if(!valid){

        return;

    }

    loginBtn.disabled=true;

    loginBtn.innerHTML=
    '<i class="fas fa-spinner fa-spin"></i> Logging In...';

    try{

        await setPersistence(

            auth,

            remember
            ? browserLocalPersistence
            : browserSessionPersistence

        );

        const userCredential=
        await signInWithEmailAndPassword(

            auth,

            email,

            password

        );

        const user=
        userCredential.user;

        localStorage.setItem(

            "loggedIn",

            "true"

        );

        localStorage.setItem(

            "userEmail",

            user.email

        );

    const redirect =
localStorage.getItem(
    "redirectAfterLogin"
);

if(redirect){

    localStorage.removeItem(
        "redirectAfterLogin"
    );

    window.location.href =
    redirect;

}

else{

    window.location.href =
    "account.html";

}

    }

    catch(error){

        let message="Login failed.";

        switch(error.code){

            case "auth/invalid-email":

                showError(
                    "email",
                    "Invalid email address."
                );

                message=
                "Invalid email.";

                break;

            case "auth/user-not-found":

                showError(
                    "email",
                    "No account found."
                );

                message=
                "Account not found.";

                break;

            case "auth/wrong-password":

                showError(
                    "password",
                    "Incorrect password."
                );

                message=
                "Incorrect password.";

                break;

            case "auth/invalid-credential":

                message=
                "Invalid email or password.";

                break;

        }

        showToast(message,"error");

        loginBtn.disabled=false;

        loginBtn.textContent="Login";

    }

});

/* ==========================
   RESET PASSWORD
========================== */

forgotPassword.addEventListener("click",async(e)=>{

    e.preventDefault();

    const email=
    document.getElementById("email").value.trim();

    if(email===""){

        showToast(
            "Enter your email first.",
            "error"
        );

        return;

    }

    try{

        await sendPasswordResetEmail(

            auth,

            email

        );

        showToast(
            "Password reset email sent."
        );

    }

    catch{

        showToast(
            "Unable to send reset email.",
            "error"
        );

    }

});

/* ==========================
   GOOGLE LOGIN
========================== */

document
.getElementById("google-login")
.addEventListener("click",()=>{

    showToast(
        "Google Sign-In will be enabled next.",
        "error"
    );

});