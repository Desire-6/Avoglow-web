const registerForm =
document.getElementById("registerForm");

registerForm.addEventListener("submit", function(e){

    e.preventDefault();

    const fullName =
    document.getElementById("fullName").value;

    const email =
    document.getElementById("email").value;

    const password =
    document.getElementById("password").value;

    const user = {

        fullName,
        email,
        password

    };

    localStorage.setItem(
        "user",
        JSON.stringify(user)
    );

    localStorage.setItem(
        "loggedIn",
        "true"
    );

    window.location.href =
    "checkout.html";

});