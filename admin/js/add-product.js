import { auth, db } from "../../firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import {
    createAdminActivity
}
from "../../adminActivity.js";

/* ===========================================
GLOBAL VARIABLES
=========================================== */

let selectedImage = null;
let isSaving = false;

/* ===========================================
CHECK ADMIN LOGIN
=========================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    const adminRef = doc(db, "admins", user.uid);

    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {

        window.location.href = "../index.html";
        return;

    }

    initialisePage();

});

/* ===========================================
INITIALISE PAGE
=========================================== */

function initialisePage() {

    try{

        initialiseImageUpload();

        initialiseIngredients();

        initialiseBenefits();

        initialiseHowToUse();

        initialiseSizes();

        initialiseSaveButton();

        initialiseCancelButton();
    }catch(error){

        console.error("Initialisation failed:", error);

    }

}
/* ==========================================
IMAGE UPLOAD
========================================== */

function initialiseImageUpload(){

    const uploadArea =
        document.getElementById("imageUploadArea");

    const fileInput =
        document.getElementById("productImageInput");

    const preview =
        document.getElementById("imagePreview");

    const placeholder =
        document.getElementById("imagePlaceholder");

    const removeBtn =
        document.getElementById("removeImageBtn");

    const fileName =
        document.getElementById("selectedFileName");

    uploadArea.onclick = (e)=>{

        if(e.target===removeBtn) return;

        fileInput.click();

    };

    fileInput.onchange = ()=>{

        const file = fileInput.files[0];

        if(!file) return;

        if(!file.type.startsWith("image/")){

            alert("Please select an image.");

            return;

        }

        if(file.size>5*1024*1024){

            alert("Image must be smaller than 5 MB.");

            return;

        }

        selectedImage = file;

        const reader = new FileReader();

        reader.onload = function(e){

            preview.src = e.target.result;

            preview.style.display = "block";

            placeholder.style.display = "none";

            removeBtn.style.display = "flex";

            fileName.textContent = file.name;

        };

        reader.readAsDataURL(file);

    };

    removeBtn.onclick = function(e){

        e.stopPropagation();

        selectedImage = null;

        fileInput.value = "";

        preview.src = "";

        preview.style.display = "none";

        placeholder.style.display = "flex";

        removeBtn.style.display = "none";

        fileName.textContent = "No image selected";

    };

}
/* ==========================================
INGREDIENTS
========================================== */

function initialiseIngredients(){

    const addBtn =
        document.getElementById("addIngredient");

    const container =
        document.getElementById("ingredientsContainer");

    /* Start with one empty row */

    addIngredientRow();

    addBtn.onclick = () => {

        addIngredientRow();

    };

}

/* ==========================================
CREATE INGREDIENT ROW
========================================== */

function addIngredientRow(value = ""){

    const container =
        document.getElementById("ingredientsContainer");

    const row = document.createElement("div");

    row.className = "dynamic-row";

    row.innerHTML = `

        <input
            type="text"
            class="ingredient-input"
            placeholder="Ingredient"
            value="${value}">

        <button
            type="button"
            class="remove-btn">

            <i class="fa-solid fa-trash"></i>

        </button>

    `;

    row.querySelector(".remove-btn").onclick = () => {

        /* Always keep at least one row */

        if(document.querySelectorAll(".dynamic-row").length === 1){

            row.querySelector("input").value = "";

            return;

        }

        row.remove();

    };

    container.appendChild(row);

}
/* ==========================================
GET INGREDIENTS
========================================== */

function getIngredients(){

    return [

        ...document.querySelectorAll(".ingredient-input")

    ]

    .map(input => input.value.trim())

    .filter(value => value !== "");

}
/* ==========================================
BENEFITS
========================================== */

function initialiseBenefits(){

    const addBtn =
        document.getElementById("addBenefit");

    addBenefitRow();

    addBtn.onclick = () => {

        addBenefitRow();

    };

}
/* ==========================================
CREATE BENEFIT ROW
========================================== */

function addBenefitRow(value = ""){

    const container =
        document.getElementById("benefitsContainer");

    const row = document.createElement("div");

    row.className = "dynamic-row";

    row.innerHTML = `

        <input
            type="text"
            class="benefit-input"
            placeholder="Benefit"
            value="${value}">

        <button
            type="button"
            class="remove-btn">

            <i class="fa-solid fa-trash"></i>

        </button>

    `;

    row.querySelector(".remove-btn").onclick = () => {

        if(document.querySelectorAll("#benefitsContainer .dynamic-row").length===1){

            row.querySelector("input").value="";

            return;

        }

        row.remove();

    };

    container.appendChild(row);

}
/* ==========================================
GET BENEFITS
========================================== */

function getBenefits(){

    return [

        ...document.querySelectorAll(".benefit-input")

    ]

    .map(input=>input.value.trim())

    .filter(value=>value!="");

}
/* ==========================================
HOW TO USE
========================================== */

function initialiseHowToUse(){

    const addBtn =
        document.getElementById("addHowToUse");

    addHowToUseRow();

    addBtn.onclick = () => {

        addHowToUseRow();

    };

}

function addHowToUseRow(value = ""){

    const container =
        document.getElementById("howToUseContainer");

    const row = document.createElement("div");

    row.className = "dynamic-row";

    row.innerHTML = `

        <textarea
            class="howToUse-input"
            rows="3"
            placeholder="Describe this step...">${value}</textarea>

        <button
            type="button"
            class="remove-btn">

            <i class="fa-solid fa-trash"></i>

        </button>

    `;

    row.querySelector(".remove-btn").onclick = () => {

        if(document.querySelectorAll("#howToUseContainer .dynamic-row").length===1){

            row.querySelector("textarea").value="";

            return;

        }

        row.remove();

    };

    container.appendChild(row);

}

function getHowToUse(){

    return [

        ...document.querySelectorAll(".howToUse-input")

    ]

    .map(step => step.value.trim())

    .filter(step => step !== "");

}
/* ==========================================
SIZES
========================================== */

function initialiseSizes(){

    const addBtn =
        document.getElementById("addSize");

    addSizeRow();

    addBtn.onclick = () => {

        addSizeRow();

    };

}
/* ==========================================
CREATE SIZE ROW
========================================== */

function addSizeRow(size = "", price = ""){

    const container =
        document.getElementById("sizesContainer");

    const row = document.createElement("div");

    row.className = "size-row";

    row.innerHTML = `

        <input
            type="text"
            class="size-input"
            placeholder="Size (250ml)"
            value="${size}">

        <input
            type="number"
            class="size-price-input"
            placeholder="Price"
            value="${price}">

        <button
            type="button"
            class="remove-btn">

            <i class="fa-solid fa-trash"></i>

        </button>

    `;

    row.querySelector(".remove-btn").onclick = () => {

        if(document.querySelectorAll(".size-row").length===1){

            row.querySelector(".size-input").value="";

            row.querySelector(".size-price-input").value="";

            return;

        }

        row.remove();

    };

    container.appendChild(row);

}
/* ==========================================
GET SIZES
========================================== */

function getSizes(){

    const rows = document.querySelectorAll(".size-row");

    const sizes = [];

    rows.forEach(row=>{

        const size =
        row.querySelector(".size-input").value.trim();

        const price =
        Number(
            row.querySelector(".size-price-input").value
        );

        if(size!=""){

            sizes.push({

                size,

                price

            });

        }

    });

    return sizes;

}
function initialiseSaveButton(){ const saveButtons = [ document.getElementById("saveProductBtn"), document.getElementById("saveProductTop") ]; saveButtons.forEach(button=>{ if(button){ button.addEventListener("click", saveProduct); } }); }

/* ==========================================
SAVE PRODUCT
========================================== */

async function saveProduct(){

    if(isSaving) return;

    isSaving = true;

    const saveButtons = [

        document.getElementById("saveProductBtn"),

        document.getElementById("saveProductTop")

    ];

    saveButtons.forEach(btn=>{

        if(!btn) return;

        btn.disabled = true;

        btn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Saving Product...

        `;

    });

    try{

        const name =
    document.getElementById("productName").value.trim();

const category =
    document.getElementById("category").value;

const price =
    Number(document.getElementById("price").value);

const stock =
    Number(document.getElementById("stock").value);

const slug =

document.getElementById("sku").value.trim()

||

name

.toLowerCase()

.replace(/[^a-z0-9]+/g,"-")

.replace(/^-|-$/g,"");

const status =
    document.getElementById("status").value;

const description =
    document.getElementById("description").value.trim();

const intro =
    document.getElementById("intro").value.trim();

const paragraph =
    document.getElementById("paragraph").value.trim();

const story =
    document.getElementById("story").value.trim();
    const ingredients = getIngredients();

const benefits = getBenefits();

const howToUse = getHowToUse();

const sizes = getSizes();

        if(!name){

    throw new Error("Product name is required.");

}

if(!category){

    throw new Error("Please select a category.");

}

if(price<=0){

    throw new Error("Enter a valid price.");

}

if(stock<0){

    throw new Error("Stock cannot be negative.");

}

if(!description){

    throw new Error("Description is required.");

}

if(!selectedImage){

    throw new Error("Please upload a product image.");

}

if(ingredients.length===0){

    throw new Error("Add at least one ingredient.");

}

if(benefits.length===0){

    throw new Error("Add at least one benefit.");

}

if(howToUse.length===0){

    throw new Error("Add at least one usage step.");

}

if(sizes.length===0){

    throw new Error("Add at least one size.");

}
        /*
        Temporary image path.
        Later we'll replace this with Firebase Storage.
        */

        const imagePath =
            "Images/" + selectedImage.name;

       const productRef = await addDoc(

    collection(db, "products"),

    {

        name,

        category,

        price,

        stock,

        slug,

        status,

        description,

        intro,

        paragraph,

        story,

        image: imagePath,

        ingredients,

        benefits,

        howToUse,

        sizes,

        displayOrder: Date.now(),

        createdAt: serverTimestamp()

    }

);


// ==========================================
// CREATE ADMIN ACTIVITY
// ==========================================

await createAdminActivity({

    type: "product",

    title: "Product Added",

    description:

        `Admin added a new product: ${name}.`,

    userName: "Admin",

    productName: name,

    metadata: {

        productId: productRef.id,

        category: category,

        price: price,

        stock: stock,

        action: "created"

    }

});


showToast(

    "Product created successfully.",

    "success"

);

setTimeout(()=>{

    window.location.href="products.html";

},1000);

    }

    catch(error){

        console.error(error);

        showToast(

    error.message,

    "error"

);

    }
    finally{

    isSaving = false;

    const saveButtons=[

        document.getElementById("saveProductBtn"),

        document.getElementById("saveProductTop")

    ];

    saveButtons.forEach(btn=>{

        if(!btn) return;

        btn.disabled=false;

        btn.innerHTML=`

            <i class="fa-solid fa-floppy-disk"></i>

            Save Product

        `;

    });

}

}
/* ==========================================
RESET FORM
========================================== */

function resetForm(){

    document.querySelector("form").reset();

    document.getElementById("ingredientsContainer").innerHTML="";

    document.getElementById("benefitsContainer").innerHTML="";

    document.getElementById("howToUseContainer").innerHTML="";

    document.getElementById("sizesContainer").innerHTML="";

    initialiseIngredients();

    initialiseBenefits();

    initialiseHowToUse();

    initialiseSizes();

    document.getElementById("imagePreview").style.display="none";

    document.getElementById("imagePlaceholder").style.display="flex";

    document.getElementById("selectedFileName").textContent="No image selected";

    document.getElementById("removeImageBtn").style.display="none";

    selectedImage=null;

}
/* ==========================================
CANCEL PRODUCT
========================================== */

function initialiseCancelButton(){

    document
    .getElementById("cancelProduct")
    .onclick=function(){

        showConfirm({

    title:"Discard Product?",

    message:"You have unsaved changes. If you leave now, all entered information will be lost.",

    onConfirm:()=>{

        window.location.href="products.html";

    }

});

    };

}
function showToast(title,message,type="success"){

const toast=document.createElement("div");

toast.className=`toast ${type}`;

toast.innerHTML=`

<i class="fas fa-circle-check"></i>

<div>

<h4>${title}</h4>

<p>${message}</p>

</div>

`;

document

.getElementById("toastContainer")

.appendChild(toast);

setTimeout(()=>{

toast.remove();

},4000);

}
/* ==========================================
CUSTOM CONFIRM
========================================== */

function showConfirm(options){

    const modal =
        document.getElementById("confirmModal");

    document.getElementById("confirmTitle").textContent =
        options.title;

    document.getElementById("confirmMessage").textContent =
        options.message;

    modal.classList.add("show");

    document.getElementById("confirmOk").onclick = () => {

        modal.classList.remove("show");

        options.onConfirm();

    };

    document.getElementById("confirmCancel").onclick = () => {

        modal.classList.remove("show");

    };

}