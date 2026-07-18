import { db } from "./firebase-config.js";

import {
    verifyPasswordResetCode,
    confirmPasswordReset
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";


const resetForm =
    document.getElementById(
        "resetPasswordForm"
    );


const resetFormContainer =
    document.getElementById(
        "resetFormContainer"
    );


const successContainer =
    document.getElementById(
        "successContainer"
    );


const resetButton =
    document.getElementById(
        "resetPasswordBtn"
    );


const newPassword =
    document.getElementById(
        "newPassword"
    );


const confirmPassword =
    document.getElementById(
        "confirmPassword"
    );


const passwordError =
    document.getElementById(
        "passwordError"
    );


const confirmError =
    document.getElementById(
        "confirmError"
    );


const params =
    new URLSearchParams(
        window.location.search
    );


const actionCode =
    params.get("oobCode");


/* ==========================================
   TOAST
========================================== */

function showToast(

    message,

    type = "success"

){

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.className =
        `toast ${type} show`;


    setTimeout(

        ()=>{

            toast.classList.remove(
                "show"
            );

        },

        4000

    );

}


/* ==========================================
   VERIFY RESET LINK
========================================== */

if(!actionCode){

    showToast(

        "Invalid or expired reset link.",

        "error"

    );


    resetFormContainer.innerHTML = `

        <div class="reset-icon error-icon">

            <i class="fa-solid fa-link-slash"></i>

        </div>


        <h2>

            Invalid Reset Link

        </h2>


        <p>

            This password reset link is invalid or has expired.

        </p>


        <a
            href="login.html"
            class="reset-btn">

            Back to Login

        </a>

    `;

}


else{

    verifyPasswordResetCode(

        auth,

        actionCode

    )

    .catch(error=>{

        console.error(error);


        resetFormContainer.innerHTML = `

            <div class="reset-icon error-icon">

                <i class="fa-solid fa-clock"></i>

            </div>


            <h2>

                Link Expired

            </h2>


            <p>

                This password reset link has expired.

                Please request a new one.

            </p>


            <a
                href="login.html"
                class="reset-btn">

                Request New Link

            </a>

        `;

    });

}


/* ==========================================
   RESET PASSWORD
========================================== */

resetForm.addEventListener(

    "submit",

    async(e)=>{

        e.preventDefault();


        passwordError.textContent =
            "";

        confirmError.textContent =
            "";


        const password =
            newPassword.value;


        const confirmation =
            confirmPassword.value;


        if(password.length < 6){

            passwordError.textContent =
                "Password must be at least 6 characters.";

            return;

        }


        if(password !== confirmation){

            confirmError.textContent =
                "Passwords do not match.";

            return;

        }


        resetButton.disabled =
            true;


        resetButton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Resetting Password...

        `;


        try{

            await confirmPasswordReset(

                auth,

                actionCode,

                password

            );


            resetFormContainer.classList.add(
                "hidden"
            );


            successContainer.classList.remove(
                "hidden"
            );


        }

        catch(error){

            console.error(error);


            showToast(

                "Unable to reset password. The link may have expired.",

                "error"

            );


            resetButton.disabled =
                false;


            resetButton.textContent =
                "Reset Password";

        }

    }

);


/* ==========================================
   SHOW / HIDE PASSWORD
========================================== */

document

    .querySelectorAll(

        ".toggle-password"

    )

    .forEach(button=>{

        button.addEventListener(

            "click",

            ()=>{

                const target =
                    document.getElementById(

                        button.dataset.target

                    );


                const icon =
                    button.querySelector(
                        "i"
                    );


                if(target.type === "password"){

                    target.type =
                        "text";


                    icon.classList.replace(

                        "fa-eye",

                        "fa-eye-slash"

                    );

                }

                else{

                    target.type =
                        "password";


                    icon.classList.replace(

                        "fa-eye-slash",

                        "fa-eye"

                    );

                }

            }

        );

    });