import { auth, db } from "../../firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
collection,
query,
orderBy,
onSnapshot,
doc,
getDoc,
updateDoc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import {
    createAdminActivity
}
from "../../adminActivity.js";

/* ======================================================
GLOBAL VARIABLES
====================================================== */

let allProducts = [];
let filteredProducts = [];

let currentPage = 1;
const productsPerPage = 10;
let currentDrawerProduct = null;

/* ======================================================
CHECK ADMIN
====================================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {

        const adminSnap = await getDoc(
            doc(db, "admins", user.uid)
        );

        if (!adminSnap.exists()) {

            alert("Access Denied");

            window.location.href = "../index.html";

            return;
        }

        initialiseDashboard();

    } catch (error) {

        console.error(error);

    }

});

/* ======================================================
INITIALISE PAGE
====================================================== */

function initialiseDashboard() {

    initialiseLogout();

    loadProducts();
    initialiseFilters();
    populateCategoryFilter();

}

/* ======================================================
LOAD PRODUCTS
====================================================== */

function loadProducts() {

    const productsQuery = query(

        collection(db, "products"),

        orderBy("displayOrder", "asc")

    );

    onSnapshot(productsQuery, (snapshot) => {

        allProducts = [];

        snapshot.forEach((productDoc) => {

            allProducts.push({

                id: productDoc.id,

                ...productDoc.data()

            });

        });

        console.log("Products Loaded");

        console.log(allProducts);

        filteredProducts = [...allProducts];

        updateStatistics();

        applyFilters();

    }, (error) => {

        console.error("Error loading products");

        console.error(error);

    });

}

/* ======================================================
UPDATE STATISTICS
====================================================== */

function updateStatistics() {

    document.getElementById("totalProducts").textContent =
        allProducts.length;

    document.getElementById("activeProducts").textContent =
        allProducts.filter(product =>
            product.status === "Active"
        ).length;

    document.getElementById("outStockProducts").textContent =
        allProducts.filter(product =>
            Number(product.stock) === 0
        ).length;

    const categories = new Set();

    allProducts.forEach(product => {

        if(product.category){

            categories.add(product.category);

        }

    });

    document.getElementById("categoriesCount").textContent =
        categories.size;

}

/* ======================================================
LOGOUT
====================================================== */

function initialiseLogout() {

    const logoutBtn =
        document.getElementById("logoutBtn");

    if(!logoutBtn) return;

    logoutBtn.onclick = async () => {

        await signOut(auth);

        window.location.href = "login.html";

    };

}

/* ======================================================
RENDER PRODUCTS
====================================================== */

function renderProducts() {

    const container = document.getElementById("productsGrid");

    container.innerHTML = "";

    if(filteredProducts.length==0){

        container.innerHTML=`

        <div class="empty-products">

            <i class="fa-solid fa-box-open"></i>

            <h3>No products found</h3>

            <p>Try changing your search or filters.</p>

        </div>

        `;

        return;

    }

    const start = (currentPage-1)*productsPerPage;

    const end = start+productsPerPage;

    const pageProducts = filteredProducts.slice(start,end);

    pageProducts.forEach(product=>{

        container.innerHTML += `

<div class="product-card">

<div class="product-left">

<input
type="checkbox"
class="product-checkbox"
data-id="${product.id}">

<img
class="product-image"
src="../${product.image}">

<div class="product-info">

<h2>

${product.name}

</h2>

<div class="product-meta">

<span>

<i class="fa-solid fa-tag"></i>

${product.category}

</span>

<span>

<strong>SKU:</strong> ${product.slug}

</span>

</div>

</div>

</div>

<div class="product-middle">

<div class="price">

UGX ${Number(product.price).toLocaleString()}

</div>

<div class="stock">

Stock

<strong>

${product.stock}

</strong>

</div>

</div>

<div class="product-status">

${getStatusBadge(product)}

</div>

<div class="product-actions">

<button
class="view-btn"
data-id="${product.id}">

<i class="fa-solid fa-pen-to-square"></i>

Manage

</button>

<button
class="delete-btn"
data-id="${product.id}">

<i class="fa-solid fa-trash"></i>

Delete

</button>

</div>

</div>

`;

    });

    renderPagination();
    initialiseProductActions();

}
/* ==========================================
INITIALISE PRODUCT ACTIONS
========================================== */

function initialiseProductActions(){

    /* Manage */

    document.querySelectorAll(".view-btn")

    .forEach(button=>{

        button.onclick=()=>{

            const id = button.dataset.id;

            openDrawer(id);

        };

    });

    /* Delete */

    document.querySelectorAll(".delete-btn")

    .forEach(button=>{

        button.onclick=()=>{

            const id = button.dataset.id;

            confirmDelete(id);

        };

    });

}
/* ======================================================
STATUS BADGES
====================================================== */

function getStatusBadge(product){

    if(product.stock==0){

        return `

        <span class="status out">

        Out of Stock

        </span>

        `;

    }

    if(product.status=="Hidden"){

        return `

        <span class="status hidden">

        Hidden

        </span>

        `;

    }

    return `

    <span class="status active">

    Active

    </span>

    `;

}
/* ======================================================
PAGINATION
====================================================== */

function renderPagination() {

    const pagesContainer =
        document.getElementById("pageNumbers");

    if (!pagesContainer) return;

    pagesContainer.innerHTML = "";

    const totalPages =
        Math.ceil(filteredProducts.length / productsPerPage);

    for (let i = 1; i <= totalPages; i++) {

        pagesContainer.innerHTML += `

<button
class="page-btn ${i === currentPage ? "active" : ""}"
data-page="${i}">

${i}

</button>

`;

    }

    document.querySelectorAll(".page-btn")

    .forEach(button => {

        button.onclick = () => {

            currentPage = Number(button.dataset.page);

            renderProducts();

        };

    });

}
document.getElementById("prevPage").onclick = () => {

    if (currentPage > 1) {

        currentPage--;

        renderProducts();

    }

};

document.getElementById("nextPage").onclick = () => {

    const totalPages =
        Math.ceil(filteredProducts.length / productsPerPage);

    if (currentPage < totalPages) {

        currentPage++;

        renderProducts();

    }

};
function loadDynamicList(containerId, inputClass, values = []) {

    const container = document.getElementById(containerId);

    container.innerHTML = "";

    values.forEach(value => {

        container.insertAdjacentHTML(

            "beforeend",

            `
            <div class="dynamic-item">

                <input
                    type="text"
                    class="${inputClass}"
                    value="${value.replace(/"/g, "&quot;")}">

                <button
                    type="button"
                    class="removeDynamic">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </div>
            `

        );

    });

}
/* ===========================================
PRODUCT DRAWER
=========================================== */
function openDrawer(productId){

    const product = allProducts.find(p=>p.id===productId);

    if(!product) return;

    currentDrawerProduct = product;
    document.getElementById("ingredientsContainer").innerHTML = "";
document.getElementById("benefitsContainer").innerHTML = "";
document.getElementById("howToUseContainer").innerHTML = "";
document.getElementById("sizesContainer").innerHTML = "";

    document.getElementById("drawerImage").src =
product.image ? "../" + product.image : "../Images/no-image.png";

    document.getElementById("editName").value =
product.name || "";

   document.getElementById("editCategory").value =
product.category || "";

    document.getElementById("editPrice").value =
product.price || 0;

 document.getElementById("editStock").value =
product.stock || 0;

    document.getElementById("editSKU").value =
product.slug || "";

    document.getElementById("editDescription").value =
product.description || "";
   document.getElementById("editIntro").value =
product.intro || "";

document.getElementById("editParagraph").value =
product.paragraph || "";

document.getElementById("editStory").value =
product.story || "";

 document.getElementById("editStatus").value =
product.status || "Active";

    /* INGREDIENTS */
loadDynamicList(

    "ingredientsContainer",

    "ingredient-input",

    product.ingredients || []

);
   loadDynamicList(

    "howToUseContainer",

    "howToUse-input",

    product.howToUse || []

);
const sizesContainer =
document.getElementById("sizesContainer");

sizesContainer.innerHTML="";

(product.sizes || []).forEach(size=>{

sizesContainer.insertAdjacentHTML(

"beforeend",

`

<div class="size-row">

<input
class="size-name"
value="${size.size}">

<input
type="number"
class="size-price"
value="${size.price}">

<button
type="button"
class="removeSize">

<i class="fa-solid fa-trash"></i>

</button>

</div>

`

);

});

    /* BENEFITS */

 loadDynamicList(

    "benefitsContainer",

    "benefit-input",

    product.benefits || []

);

    document
    .getElementById("productDrawer")
    .classList.add("show");

};
/* ==========================================
DELETE PRODUCT
========================================== */

function confirmDelete(productId){

    const product =
        allProducts.find(p=>p.id===productId);

    if(!product) return;

    showConfirm({

        title:"Delete Product",

        message:`Delete "${product.name}" permanently? This action cannot be undone.`,

        confirmText:"Delete",

        onConfirm:()=>{

            deleteProduct(productId);

        }

    });

}
/* ==========================================
CONFIRM
========================================== */

function showConfirm(options){

    const modal =
        document.getElementById("confirmModal");

    document.getElementById("confirmTitle").textContent =
        options.title;

    document.getElementById("confirmMessage").textContent =
        options.message;

    document.getElementById("confirmOk").textContent =
        options.confirmText || "Confirm";

    modal.classList.add("show");

    document.getElementById("confirmCancel").onclick=()=>{

        modal.classList.remove("show");

    };

    document.getElementById("confirmOk").onclick=()=>{

        modal.classList.remove("show");

        options.onConfirm();

    };

}
/* ==========================================
DELETE FROM FIRESTORE
========================================== */

async function deleteProduct(productId){

    try{

        // Find product before deleting it
        const product = allProducts.find(

            p => p.id === productId

        );


        await deleteDoc(

            doc(

                db,

                "products",

                productId

            )

        );


        // ==================================
        // CREATE ACTIVITY
        // ==================================

        await createAdminActivity({

            type: "product",

            title: "Product Deleted",

            description:

                `Admin deleted product: ${
                    product?.name || "Unknown Product"
                }.`,


            userName: "Admin",

            productName:

                product?.name || "Unknown Product",


            metadata: {

                productId: productId,

                category:

                    product?.category || "",

                action: "deleted"

            }

        });


        showToast(

            "Product deleted successfully.",

            "success"

        );


        allProducts =

            allProducts.filter(

                p => p.id !== productId

            );


        applyFilters();

        updateStatistics();

    }

    catch(error){

        console.error(error);

        showToast(

            "Failed to delete product.",

            "error"

        );

    }

}
document.getElementById("saveProduct").onclick = async () => {

    if (!currentDrawerProduct) return;
    const name =
document.getElementById("editName").value.trim();

const price =
Number(document.getElementById("editPrice").value);

const stock =
Number(document.getElementById("editStock").value);

if(!name){

    showToast(

        "Product name is required.",

        "error"

    );

    return;

}

if(price <= 0){

    showToast(

        "Price must be greater than zero.",

        "error"

    );

    return;

}

if(stock < 0){

    showToast(

        "Stock cannot be negative.",

        "error"

    );

    return;

}
const saveBtn =
document.getElementById("saveProduct");

saveBtn.disabled = true;

saveBtn.innerHTML = `

<i class="fa-solid fa-spinner fa-spin"></i>

Saving...

`;

    const productRef = doc(
        db,
        "products",
        currentDrawerProduct.id
    );
 const ingredients =

[...document.querySelectorAll(".ingredient-input")]

.map(i => i.value.trim())

.filter(Boolean);

const benefits =

[...document.querySelectorAll(".benefit-input")]

.map(i => i.value.trim())

.filter(Boolean);

const howToUse =

[...document.querySelectorAll(".howToUse-input")]

.map(i => i.value.trim())

.filter(Boolean);
const sizes =

[

...document.querySelectorAll(".size-row")

]

.map(row=>({

size:

row.querySelector(".size-name").value,

price:Number(

row.querySelector(".size-price").value

)

}));

    await updateDoc(

    productRef,

    {

        name: name,

        category:

            document

            .getElementById(

                "editCategory"

            )

            .value,

        price: price,

        stock: stock,

        slug:

            document

            .getElementById(

                "editSKU"

            )

            .value,

        status:

            document

            .getElementById(

                "editStatus"

            )

            .value,

        description:

            document

            .getElementById(

                "editDescription"

            )

            .value,

        intro:

            document

            .getElementById(

                "editIntro"

            )

            .value,

        paragraph:

            document

            .getElementById(

                "editParagraph"

            )

            .value,

        story:

            document

            .getElementById(

                "editStory"

            )

            .value,

        ingredients,

        benefits,

        howToUse,

        sizes

    }

);


// ==================================
// CREATE ACTIVITY
// ==================================

await createAdminActivity({

    type: "product",

    title: "Product Updated",

    description:

        `Admin updated product: ${name}.`,

    userName: "Admin",

    productName: name,

    metadata: {

        productId:

            currentDrawerProduct.id,

        category:

            document

            .getElementById(

                "editCategory"

            )

            .value,

        price: price,

        stock: stock,

        action: "updated"

    }

});
   showToast(

    `"${name}" updated successfully.`,

    "success"

);

saveBtn.disabled = false;

saveBtn.innerHTML = `

<i class="fa-solid fa-floppy-disk"></i>

Save Changes

`;

closeDrawer();
    document
        .getElementById("productDrawer")
        .classList.remove("show");

};
function addDynamicItem(containerId, inputClass, placeholder) {

    const container = document.getElementById(containerId);

    container.insertAdjacentHTML(

        "beforeend",

        `
        <div class="dynamic-item">

            <input
                type="text"
                class="${inputClass}"
                placeholder="${placeholder}">

            <button
                type="button"
                class="removeDynamic">

                <i class="fa-solid fa-trash"></i>

            </button>

        </div>
        `

    );

}
document.getElementById("addIngredient").onclick = () => {

    addDynamicItem(

        "ingredientsContainer",

        "ingredient-input",

        "Ingredient"

    );

};

document.getElementById("addBenefit").onclick = () => {

    addDynamicItem(

        "benefitsContainer",

        "benefit-input",

        "Benefit"

    );

};

document.getElementById("addHowToUse").onclick = () => {

    addDynamicItem(

        "howToUseContainer",

        "howToUse-input",

        "Step"

    );

};
document.addEventListener("click",function(e){

if(

e.target.closest(".removeDynamic") ||

e.target.closest(".removeSize")

){

e.target

.closest(".dynamic-item, .size-row")

.remove();

}

});
document.getElementById("addSize").onclick=function(){

document.getElementById("sizesContainer")

.insertAdjacentHTML(

"beforeend",

`

<div class="size-row">

<input
class="size-name"
placeholder="100 ml">

<input
type="number"
class="size-price"
placeholder="Price">

<button
type="button"
class="removeSize">

<i class="fa-solid fa-trash"></i>

</button>

</div>

`

);

};
/* CLOSE */

document
.getElementById("closeDrawer")
.onclick=function(){

    document
    .getElementById("productDrawer")
    .classList.remove("show");

};

document
.querySelector(".drawer-overlay")
.onclick=function(){

    document
    .getElementById("productDrawer")
    .classList.remove("show");

};
document.getElementById("cancelEdit").onclick = () => {

    document
        .getElementById("productDrawer")
        .classList.remove("show");

    currentDrawerProduct = null;

};
/* ==========================================
FILTERS
========================================== */

function initialiseFilters(){

    document
        .getElementById("searchProduct")
        .addEventListener("input", applyFilters);

    document
        .getElementById("categoryFilter")
        .addEventListener("change", applyFilters);

    document
        .getElementById("statusFilter")
        .addEventListener("change", applyFilters);

    document
        .getElementById("stockFilter")
        .addEventListener("change", applyFilters);

    document
        .getElementById("sortFilter")
        .addEventListener("change", applyFilters);

    document
        .getElementById("resetFilters")
        .addEventListener("click", resetFilters);

}
/* ==========================================
APPLY FILTERS
========================================== */

function applyFilters(){

    const search =
        document
        .getElementById("searchProduct")
        .value
        .toLowerCase()
        .trim();

    const category =
        document
        .getElementById("categoryFilter")
        .value;

    const status =
        document
        .getElementById("statusFilter")
        .value;

    const stock =
        document
        .getElementById("stockFilter")
        .value;

    const sort =
        document
        .getElementById("sortFilter")
        .value;

    filteredProducts = [...allProducts];

    /* SEARCH */

    if(search){

        filteredProducts = filteredProducts.filter(product=>{

            return (

                product.name.toLowerCase().includes(search)

                ||

                product.slug.toLowerCase().includes(search)

                ||

                product.category.toLowerCase().includes(search)

            );

        });

    }

    /* CATEGORY */

    if(category !== "All Categories"){

        filteredProducts = filteredProducts.filter(product=>

            product.category === category

        );

    }

    /* STATUS */

    if(status !== "All Status"){

        filteredProducts = filteredProducts.filter(product=>

            product.status === status

        );

    }

    /* STOCK */

    if(stock === "In Stock"){

        filteredProducts = filteredProducts.filter(product=>

            product.stock > 10

        );

    }

    if(stock === "Low Stock"){

        filteredProducts = filteredProducts.filter(product=>

            product.stock > 0 && product.stock <= 10

        );

    }

    if(stock === "Out of Stock"){

        filteredProducts = filteredProducts.filter(product=>

            product.stock === 0

        );

    }

    /* SORT */

    switch(sort){

        case "PriceHigh":

            filteredProducts.sort((a,b)=>b.price-a.price);

            break;

        case "PriceLow":

            filteredProducts.sort((a,b)=>a.price-b.price);

            break;

        case "AZ":

            filteredProducts.sort((a,b)=>

                a.name.localeCompare(b.name)

            );

            break;

        case "ZA":

            filteredProducts.sort((a,b)=>

                b.name.localeCompare(a.name)

            );

            break;

        case "Oldest":

            filteredProducts.reverse();

            break;

    }

    renderProducts(filteredProducts);

}
/* ==========================================
RESET FILTERS
========================================== */

function resetFilters(){

    document.getElementById("searchProduct").value="";

    document.getElementById("categoryFilter").selectedIndex=0;

    document.getElementById("statusFilter").selectedIndex=0;

    document.getElementById("stockFilter").selectedIndex=0;

    document.getElementById("sortFilter").selectedIndex=0;

    filteredProducts=[...allProducts];
    currentPage = 1;

    renderProducts(filteredProducts);

}
/* ==========================================
POPULATE CATEGORY FILTER
========================================== */

function populateCategoryFilter(){

    const categoryFilter =
        document.getElementById("categoryFilter");

    categoryFilter.innerHTML = `
        <option>All Categories</option>
        <option>Hair Care</option>
        <option>Skin Care</option>
        <option>Wellness</option>
    `;

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
document.getElementById("addProductBtn").onclick = function () {

    window.location.href = "add-product.html";

};