import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    fetchSignInMethodsForEmail,
    linkWithCredential
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    arrayUnion,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import {
    loginWithEmail,
    loginWithGoogle,
    getUser,
    getUserRole
} from "./auth-service.js";

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

async function redirectUser(user) {

    const role = await getUserRole(user.uid);

    if (role === "admin") {

        window.location.href = "admin/dashboard.html";
        return;

    }

    const redirect =
        localStorage.getItem("redirectAfterLogin");

    if (redirect) {

        localStorage.removeItem("redirectAfterLogin");

        window.location.href = redirect;

    } else {

        window.location.href = "account.html";

    }

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

       const user =
    await loginWithEmail(
        email,
        password
    );
        const userDoc = await getDoc(
    doc(
        db,
        "users",
        user.uid
    )
);

if(userDoc.exists()){

    const userData =
        userDoc.data();

    if(userData.status === "Blocked"){

        await auth.signOut();

        showToast(
            "Your account has been blocked by an administrator.",
            "error"
        );

        loginBtn.disabled = false;

        loginBtn.textContent = "Login";

        return;

    }

}

        localStorage.setItem(

            "loggedIn",

            "true"

        );

        localStorage.setItem(

            "userEmail",

            user.email

        );

 await redirectUser(user);
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

forgotPassword.addEventListener(
    "click",
    async (e) => {

        e.preventDefault();

        const emailInput =
            document.getElementById("email");

        const email =
            emailInput.value.trim();


        if(email === ""){

            showError(
                "email",
                "Enter your email address first."
            );

            showToast(
                "Enter your email address first.",
                "error"
            );

            emailInput.focus();

            return;

        }


        // Basic email validation

        if(!email.includes("@")){

            showError(
                "email",
                "Enter a valid email address."
            );

            showToast(
                "Enter a valid email address.",
                "error"
            );

            return;

        }


        const originalText =
            forgotPassword.textContent;


        forgotPassword.style.pointerEvents =
            "none";

        forgotPassword.innerHTML = `

            <i class="fas fa-spinner fa-spin"></i>

            Sending...

        `;


        try{

            const actionCodeSettings = {

    url:
        window.location.origin +
        "/reset-password.html",

    handleCodeInApp: true

};

await sendPasswordResetEmail(

    auth,

    email,

    actionCodeSettings

);


            showToast(

                "Password reset link sent to your email."

            );


            forgotPassword.innerHTML = `

                <i class="fas fa-check"></i>

                Email Sent

            `;


            setTimeout(()=>{

                forgotPassword.innerHTML =
                    originalText;

                forgotPassword.style.pointerEvents =
                    "auto";

            },4000);


        }

        catch(error){

            console.error(

                "Password reset error:",

                error

            );


            let message =
                "Unable to send password reset email.";


            switch(error.code){

                case "auth/user-not-found":

                    message =
                        "No account exists with this email.";

                    break;


                case "auth/invalid-email":

                    message =
                        "Invalid email address.";

                    break;


                case "auth/too-many-requests":

                    message =
                        "Too many requests. Try again later.";

                    break;

            }


            showToast(

                message,

                "error"

            );


            forgotPassword.textContent =
                originalText;

            forgotPassword.style.pointerEvents =
                "auto";

        }

    }

);

/* ==========================
   GOOGLE LOGIN
========================== */

// const googleLoginButton =
//     document.getElementById("google-login");

// if(googleLoginButton){

//     googleLoginButton.addEventListener(
//         "click",
//         signInWithGoogle
//     );

// }


// async function signInWithGoogle(){

//     const originalContent =
//         googleLoginButton.innerHTML;


//     googleLoginButton.disabled = true;


//     googleLoginButton.innerHTML = `

//         <i class="fas fa-spinner fa-spin"></i>

//         Signing in...

//     `;


//     try{

//        const user =
//     await loginWithGoogle();


//         /*
//         ==========================================
//         CHECK FIRESTORE USER PROFILE
//         ==========================================
//         */

//         const userRef =
//             doc(

//                 db,

//                 "users",

//                 user.uid

//             );


//         const userSnap =
//             await getDoc(

//                 userRef

//             );


//         /*
//         ==========================================
//         BLOCKED USER CHECK
//         ==========================================
//         */

//         if(userSnap.exists()){

//             const userData =
//                 userSnap.data();


//             if(

//                 userData.status === "Blocked"

//             ){

//                 await auth.signOut();


//                 showToast(

//                     "Your account has been blocked by an administrator.",

//                     "error"

//                 );


//                 googleLoginButton.disabled =
//                     false;


//                 googleLoginButton.innerHTML =
//                     originalContent;


//                 return;

//             }

//         }


//         /*
//         ==========================================
//         CREATE OR UPDATE USER PROFILE
//         ==========================================
//         */

//         if(!userSnap.exists()){

//             await setDoc(

//                 userRef,

//                 {

//                     uid:
//                         user.uid,

//                     name:
//                         user.displayName || "",

//                     email:
//                         user.email || "",

//                     phone:
//                         user.phoneNumber || "",

//                     photoURL:
//                         user.photoURL || "",

//                     status:
//                         "Active",

//                     providers:
//                         ["google"],

//                     createdAt:
//                         serverTimestamp()

//                 }

//             );

//         }

//         else{

//             await setDoc(

//                 userRef,

//                 {

//                     name:
//                         user.displayName || "",

//                     email:
//                         user.email || "",

//                     photoURL:
//                         user.photoURL || "",

//                     providers:
//                         arrayUnion("google")

//                 },

//                 {

//                     merge:
//                         true

//                 }

//             );

//         }


//         /*
//         ==========================================
//         SAVE LOGIN STATE
//         ==========================================
//         */

//         localStorage.setItem(

//             "loggedIn",

//             "true"

//         );


//         localStorage.setItem(

//             "userEmail",

//             user.email

//         );


//         /*
//         ==========================================
//         REDIRECT
//         ==========================================
//         */

// await redirectUser(user);

//     }

//     catch(error){

//         console.error(

//             "Google sign-in error:",

//             error

//         );


//         let message =
//             "Unable to sign in with Google.";


//         switch(error.code){

//             case "auth/popup-closed-by-user":

//                 message =
//                     "Google sign-in was cancelled.";

//                 break;


//             case "auth/popup-blocked":

//                 message =
//                     "Please allow popups to sign in with Google.";

//                 break;


//             case "auth/unauthorized-domain":

//                 message =
//                     "This website domain is not authorized for Google sign-in.";

//                 break;

//         }


//         showToast(

//             message,

//             "error"

//         );


//         googleLoginButton.disabled =
//             false;


//         googleLoginButton.innerHTML =
//             originalContent;

//     }

// }