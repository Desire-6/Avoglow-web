const deliveryOptions = document.getElementById("deliveryOptions");

const savedDeliveryCard = document.getElementById("savedDeliveryCard");

const changeDeliveryBtn = document.getElementById("changeDeliveryBtn");

const savedDeliveryTitle = document.getElementById("savedDeliveryTitle");

const savedDeliveryDescription = document.getElementById("savedDeliveryDescription");

const deliveryRadios = document.querySelectorAll("input[name='delivery']");

deliveryRadios.forEach(radio=>{

    radio.addEventListener("change",()=>{
if (radio.value === "pickup") {

    savedDeliveryTitle.textContent =
        "Pickup Station";

    savedDeliveryDescription.textContent =
        "Transport Fee: UGX 5,000 • Pickup at Oxepress Office, Mega Supermarket Building, Opposite Old Taxi Park, Kampala.";

}

if (radio.value === "home") {

    savedDeliveryTitle.textContent =
        "Home Delivery";

    savedDeliveryDescription.textContent =
        "Transport Fee: UGX 5,000 • Home delivery from the Kampala Hub is charged separately. We'll contact you to confirm the local delivery fee.";

}

        deliveryOptions.style.display="none";

        savedDeliveryCard.style.display="flex";

        changeDeliveryBtn.style.display="inline-flex";

    });

});


changeDeliveryBtn.onclick=()=>{

    deliveryOptions.style.display="block";

    savedDeliveryCard.style.display="none";

    changeDeliveryBtn.style.display="none";

};
/* ==========================
   RESET DELIVERY ON PAGE LOAD
========================== */

deliveryRadios.forEach(radio => {

    radio.checked = false;

});
