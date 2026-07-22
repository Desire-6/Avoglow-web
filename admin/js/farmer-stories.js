import {auth, db } from "../../firebase-config.js";
import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {

    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    doc

}

from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import {
    requireAdmin
} from "../../auth-service.js";
/*=====================================
CHECK ADMIN LOGIN
=====================================*/

async function checkAdminAccess(){

    try{

        await requireAdmin();

        initialiseStories();

    }

    catch(error){

        console.error(error);

        window.location.href = "../../login.html";

    }

}

checkAdminAccess();
/*=====================================
ELEMENTS
=====================================*/

const tbody =
document.getElementById("storiesTableBody");

const searchInput =
document.getElementById("searchStory");

const addStoryBtn =
document.getElementById("addStoryBtn");

const storyModal =
document.getElementById("storyModal");

const deleteModal =
document.getElementById("deleteStoryModal");

const storyForm =
document.getElementById("storyForm");

const closeModalBtn =
document.getElementById("closeStoryModal");

const cancelDeleteBtn =
document.getElementById("cancelDeleteStory");

const confirmDeleteBtn =
document.getElementById("confirmDeleteStory");
/*=====================================
GLOBALS
=====================================*/

let stories = [];

let selectedStoryId = null;
let storyToDelete = null;

/* Pagination */
let currentPage = 1;
const rowsPerPage = 20;
/*=====================================
LOAD STORIES
=====================================*/

function initialiseStories(){

    const storiesQuery = query(

        collection(db,"farmerStories"),

        orderBy("createdAt","desc")

    );

    onSnapshot(

        storiesQuery,

        snapshot=>{

            stories = [];

            snapshot.forEach(doc=>{

                stories.push({

                    id: doc.id,

                    ...doc.data()

                });

            });

            currentPage = 1;

            renderStories(stories);

            updateStats();

        }

    );

}

function renderStories(data){

  tbody.innerHTML = "";

if(data.length === 0){

    tbody.innerHTML = `
        <tr>
            <td colspan="5">
                No farmer stories found.
            </td>
        </tr>
    `;

    document.getElementById("pagination").innerHTML = "";

    return;

}

const start = (currentPage - 1) * rowsPerPage;

const end = start + rowsPerPage;

const paginatedStories = data.slice(start, end);

paginatedStories.forEach(story=>{

        tbody.innerHTML+=`

        <tr>

            <td>

                ${story.farmerName}

            </td>

            <td>

                ${story.location}

            </td>

            <td>

                <span class="status ${story.published ? "published":"draft"}">

                    ${story.published ? "Published":"Draft"}

                </span>

            </td>

            <td>

                ${
                    story.createdAt

                    ?

                    new Date(

                        story.createdAt.seconds*1000

                    ).toLocaleDateString()

                    :

                    "-"
                }

            </td>

            <td>

                <button

                    class="action-btn edit"

                    data-id="${story.id}"

                >

                    <i class="fas fa-pen"></i>

                </button>

                <button

                    class="action-btn delete"

                    data-id="${story.id}"

                >

                    <i class="fas fa-trash"></i>

                </button>

            </td>

        </tr>

        `;

    });

    attachRowEvents();
    renderPagination(data.length);

}
function renderPagination(totalItems){

    const pagination =
    document.getElementById("pagination");

    pagination.innerHTML = "";

    const totalPages =
    Math.ceil(totalItems / rowsPerPage);

    if(totalPages <= 1) return;

    // Previous

    const prev = document.createElement("button");

    prev.textContent = "Previous";

    prev.disabled = currentPage === 1;

    prev.onclick = ()=>{

        currentPage--;

        renderStories(stories);

    };

    pagination.appendChild(prev);

    // Page Numbers

    for(let i=1;i<=totalPages;i++){

        const btn = document.createElement("button");

        btn.textContent = i;

        if(i===currentPage){

            btn.classList.add("active");

        }

        btn.onclick = ()=>{

            currentPage = i;

            renderStories(stories);

        };

        pagination.appendChild(btn);

    }

    // Next

    const next = document.createElement("button");

    next.textContent = "Next";

    next.disabled = currentPage === totalPages;

    next.onclick = ()=>{

        currentPage++;

        renderStories(stories);

    };

    pagination.appendChild(next);

}
function attachRowEvents(){

    document

    .querySelectorAll(".edit")

    .forEach(button=>{

        button.onclick=()=>{

            openEditModal(

                button.dataset.id

            );

        };

    });

    document

    .querySelectorAll(".delete")

    .forEach(button=>{

        button.onclick=()=>{

            openDeleteModal(

                button.dataset.id

            );

        };

    });

}
function updateStats(){

    document.getElementById("totalStories").textContent=

        stories.length;

    document.getElementById("publishedStories").textContent=

        stories.filter(

            s=>s.published

        ).length;

    document.getElementById("draftStories").textContent=

        stories.filter(

            s=>!s.published

        ).length;

}
/*=====================================
ADD STORY
=====================================*/

addStoryBtn.addEventListener("click",()=>{

    selectedStoryId = null;

    storyForm.reset();

    document.getElementById("modalTitle").textContent =
        "Add Farmer Story";

    storyModal.classList.remove("hidden");

});
closeModalBtn.addEventListener("click",()=>{

    storyModal.classList.add("hidden");

});

window.addEventListener("click",(e)=>{

    if(e.target===storyModal){

        storyModal.classList.add("hidden");

    }

});
/*=====================================
EDIT STORY
=====================================*/

function openEditModal(id){

    selectedStoryId = id;

    const story = stories.find(s=>s.id===id);

    if(!story) return;

    document.getElementById("modalTitle").textContent =
        "Edit Farmer Story";

    document.getElementById("storyId").value =
        story.id;

    document.getElementById("farmerName").value =
        story.farmerName;

    document.getElementById("farmerLocation").value =
        story.location;

    document.getElementById("farmerStory").value =
        story.story;

    document.getElementById("storyPublished").checked =
        story.published;

    storyModal.classList.remove("hidden");

}
/*=====================================
SAVE STORY
=====================================*/

storyForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const saveBtn =
        document.getElementById("saveStoryBtn");

    const originalText =
        saveBtn.innerHTML;

    saveBtn.disabled = true;

    saveBtn.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        Saving...
    `;

    const farmerName =
        document.getElementById("farmerName").value.trim();

    const location =
        document.getElementById("farmerLocation").value.trim();

    const story =
        document.getElementById("farmerStory").value.trim();

    const published =
        document.getElementById("storyPublished").checked;

    const data = {

        farmerName,

        location,

        story,

        published

    };

    try{

        if(selectedStoryId){

            await updateDoc(

                doc(db,"farmerStories",selectedStoryId),

                data

            );

            showToast("Story updated.", "success");

        }

        else{

            data.createdAt = serverTimestamp();

            await addDoc(

                collection(db,"farmerStories"),

                data

            );

            showToast("Story added.", "success");

        }

        storyModal.classList.add("hidden");

        storyForm.reset();

    }

    catch(error){

        console.error(error);

        showToast("Unable to save story.","error");

    }

    saveBtn.disabled = false;

    saveBtn.innerHTML = originalText;

});
/*=====================================
SEARCH
=====================================*/

searchInput.addEventListener(

    "input",

    ()=>{

        const keyword =

        searchInput.value

        .toLowerCase()

        .trim();

        const filtered = stories.filter(

            story=>

                story.farmerName

                .toLowerCase()

                .includes(keyword)

                ||

                story.location

                .toLowerCase()

                .includes(keyword)

                ||

                story.story

                .toLowerCase()

                .includes(keyword)

        );

       currentPage = 1;

renderStories(filtered);

    }

);
function openDeleteModal(id){

    storyToDelete = id;

    deleteModal.classList.remove("hidden");

}
cancelDeleteBtn.addEventListener(

    "click",

    ()=>{

        deleteModal.classList.add("hidden");

        storyToDelete = null;

    }

);
confirmDeleteBtn.addEventListener(

    "click",

    async()=>{

        if(!storyToDelete) return;

        confirmDeleteBtn.disabled = true;

        confirmDeleteBtn.innerHTML = `

        <i class="fas fa-spinner fa-spin"></i>

        Deleting...

        `;

        try{

            await deleteDoc(

                doc(

                    db,

                    "farmerStories",

                    storyToDelete

                )

            );

            showToast(

                "Story deleted.", "success"

            );

        }

        catch(error){

            console.error(error);

            showToast(

                "Unable to delete story.",

                "error"

            );

        }

        confirmDeleteBtn.disabled = false;

        confirmDeleteBtn.innerHTML = "Delete";

        deleteModal.classList.add("hidden");

        storyToDelete = null;

    }

);
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
/* ===========================
LOGOUT
=========================== */

document.getElementById("logoutBtn")

.onclick=async()=>{

await signOut(auth);

window.location.href="../../login.html";

};
