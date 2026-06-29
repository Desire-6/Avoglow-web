import { auth, db } from "./firebase-config.js";

import {

    createUserWithEmailAndPassword,

    updateProfile

} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const form =
document.getElementById("signup-form");

const submitBtn =
document.getElementById("signup-btn");

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
   INLINE ERRORS
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
    .getElementById(id+"-error")
    .textContent=message;

    document
    .getElementById(id)
    .classList.add("error");

}

/* ==========================
   SHOW / HIDE PASSWORD
========================== */

document
.querySelectorAll(".toggle-password")
.forEach(icon=>{

    icon.addEventListener("click",()=>{

        const input =
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
   SIGNUP
========================== */

form.addEventListener("submit",async(e)=>{

    e.preventDefault();

    clearErrors();

    const name =
    document.getElementById("name").value.trim();

    const email =
    document.getElementById("email").value.trim();

    const password =
    document.getElementById("password").value;

    const confirmPassword =
    document.getElementById("confirmPassword").value;

    let valid=true;

    if(name===""){

        showError("name","Please enter your full name.");

        valid=false;

    }

    if(email===""){

        showError("email","Please enter your email.");

        valid=false;

    }

    if(password.length<6){

        showError("password","Password must be at least 6 characters.");

        valid=false;

    }

    if(password!==confirmPassword){

        showError("confirmPassword","Passwords do not match.");

        valid=false;

    }

    if(!valid){

        showToast("Please correct the highlighted fields.","error");

        return;

    }

    submitBtn.disabled=true;

    submitBtn.innerHTML=
    '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

    try{

        const userCredential =
        await createUserWithEmailAndPassword(

            auth,

            email,

            password

        );

        const user =
        userCredential.user;
        await updateProfile(user, {

    displayName: name

});

        await setDoc(

            doc(db,"users",user.uid),

            {

                name,

                email,

                createdAt:new Date()

            }

        );

window.location.href =
"account.html";
    }

    catch(error){

        let message="Something went wrong.";

        if(error.code==="auth/email-already-in-use"){

            showError(
                "email",
                "This email is already registered."
            );

            message=
            "This email is already registered.";

        }

        else if(error.code==="auth/invalid-email"){

            showError(
                "email",
                "Please enter a valid email."
            );

            message=
            "Please enter a valid email.";

        }

        else if(error.code==="auth/weak-password"){

            showError(
                "password",
                "Password must be at least 6 characters."
            );

            message=
            "Password is too weak.";

        }

        showToast(message,"error");

        submitBtn.disabled=false;

        submitBtn.textContent=
        "Create Account";

    }

});