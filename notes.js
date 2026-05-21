// notes.js
import { auth } from "./firebase.js";
import { db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let currentUser = null;
let allNotes = [];
let currentCategory = "Semua";
let currentNoteId = null;
let searchQuery = "";

const userName = document.getElementById("userName");
const userPhoto = document.getElementById("userPhoto");
const btnLogout = document.getElementById("btnLogout");
const btnNewNote = document.getElementById("btnNewNote");
const btnNewNote2 = document.getElementById("btnNewNote2");
const btnToggleSidebar = document.getElementById("btnToggleSidebar");
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("mainContent");
const searchInput = document.getElementById("searchInput");
const pageTitle = document.getElementById("pageTitle");
const noteCount = document.getElementById("noteCount");
const pinnedSection = document.getElementById("pinnedSection");
const pinnedGrid = document.getElementById("pinnedGrid");
const notesGrid = document.getElementById("notesGrid");
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const otherLabel = document.getElementById("otherLabelWrap");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const noteTitle = document.getElementById("noteTitle");
const noteCategory = document.getElementById("noteCategory");
const noteContent = document.getElementById("noteContent");
const notePin = document.getElementById("notePin");
const btnSaveNote = document.getElementById("btnSaveNote");
const btnDeleteNote = document.getElementById("btnDeleteNote");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancelModal = document.getElementById("btnCancelModal");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  userName.textContent = user.displayName;
  userName.classList.remove("hidden");
  const sidebarName = document.getElementById("sidebarName");
  if (sidebarName) sidebarName.textContent = user.displayName;
  if (user.photoURL) {
    userPhoto.src = user.photoURL;
    userPhoto.classList.remove("hidden");
  }
  loadNotes();
});

btnLogout.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

btnToggleSidebar.addEventListener("click", () => {
  sidebar.classList.toggle("sidebar-hidden");
  mainContent.classList.toggle("main-expanded");
});

function loadNotes() {
  const q = query(
    collection(db, "notes"),
    where("userId", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );
  onSnapshot(q, (snapshot) => {
    allNotes = [];
    snapshot.forEach((doc) => {
      allNotes.push({ id: doc.id, ...doc.data() });
    });
    renderNotes();
  });
}

function renderNotes() {
  loadingState.classList.add("hidden");
  const totalNotes = document.getElementById("totalNotes");
  if (totalNotes) totalNotes.textContent = allNotes.length;

  let filtered = currentCategory === "Semua"
    ? allNotes
    : allNotes.filter(n => n.category === currentCategory);

  if (searchQuery) {
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(searchQuery) ||
      n.content.toLowerCase().includes(searchQuery)
    );
  }

  pageTitle.textContent = currentCategory === "Semua" ? "Semua Catatan" : currentCategory;
  noteCount.textContent = `${filtered.length} catatan`;

  const pinned = filtered.filter(n => n.isPinned);
  const unpinned = filtered.filter(n => !n.isPinned);

  if (pinned.length > 0) {
    pinnedSection.classList.remove("hidden");
    pinnedGrid.innerHTML = pinned.map(noteCard).join("");
  } else {
    pinnedSection.classList.add("hidden");
    pinnedGrid.innerHTML = "";
  }

  if (unpinned.length > 0) {
    if (otherLabel) otherLabel.classList.toggle("hidden", pinned.length === 0);
    notesGrid.innerHTML = unpinned.map(noteCard).join("");
  } else {
    notesGrid.innerHTML = "";
    if (otherLabel) otherLabel.classList.add("hidden");
  }

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  document.querySelectorAll(".note-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".btn-pin") || e.target.closest(".btn-export")) return;
      openEditModal(card.dataset.id);
    });
  });

  document.querySelectorAll(".btn-pin").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const note = allNotes.find(n => n.id === btn.dataset.id);
      togglePin(btn.dataset.id, note.isPinned);
    });
  });

  document.querySelectorAll(".btn-export").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const note = allNotes.find(n => n.id === btn.dataset.id);
      exportNote(note);
    });
  });
}

function noteCard(note) {
  const date = note.createdAt?.toDate
    ? note.createdAt.toDate().toLocaleDateString("id-ID", {
        day: "numeric", month: "short", year: "numeric"
      })
    : "Baru saja";

  const preview = note.content.length > 120
    ? note.content.substring(0, 120) + "..."
    : note.content;

  const categoryColors = {
    Personal: "#5a7a4a",
    Kerja:    "#3a5a2a",
    Ide:      "#8a6a1a",
    Penting:  "#8a3a2a",
    Lainnya:  "#6a8a5a",
  };

  const color = categoryColors[note.category] || categoryColors["Lainnya"];

  return `
    <div class="note-card rounded-2xl p-5 cursor-pointer flex flex-col gap-3"
      style="border-top:3px solid ${color}"
      data-id="${note.id}">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-bold text-base leading-snug flex-1" style="color:var(--green-deep)">
          ${note.title || "Tanpa Judul"}
        </h3>
        <button class="btn-pin w-8 h-8 rounded-lg flex items-center justify-center transition text-base"
          style="background:white;border:1px solid var(--paper-line)"
          data-id="${note.id}">
          ${note.isPinned ? "📌" : "🔖"}
        </button>
      </div>
      <p class="text-sm leading-relaxed flex-1" style="color:var(--text-muted)">
        ${preview || "Tidak ada isi catatan"}
      </p>
      <div class="flex items-center justify-between pt-2" style="border-top:1px solid var(--paper-line)">
        <span class="text-xs px-3 py-1 rounded-md font-semibold"
          style="background:rgba(90,122,74,0.1);color:${color}">
          ${note.category}
        </span>
        <div class="flex items-center gap-2">
          <span class="text-xs" style="color:var(--text-light)">${date}</span>
          <button class="btn-export w-7 h-7 rounded-lg flex items-center justify-center transition text-xs"
            style="background:white;border:1px solid var(--paper-line)"
            data-id="${note.id}">⬇️</button>
        </div>
      </div>
    </div>
  `;
}

document.querySelectorAll(".category-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active-category"));
    btn.classList.add("active-category");
    currentCategory = btn.dataset.category;
    renderNotes();
  });
});

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  renderNotes();
});

function openNewModal() {
  currentNoteId = null;
  modalTitle.textContent = "Catatan Baru";
  noteTitle.value = "";
  noteCategory.value = "Personal";
  noteContent.value = "";
  notePin.checked = false;
  btnDeleteNote.classList.add("hidden");
  modal.classList.remove("hidden");
  noteTitle.focus();
}

btnNewNote.addEventListener("click", openNewModal);
btnNewNote2.addEventListener("click", openNewModal);

function openEditModal(id) {
  const note = allNotes.find(n => n.id === id);
  if (!note) return;
  currentNoteId = id;
  modalTitle.textContent = "Edit Catatan";
  noteTitle.value = note.title;
  noteCategory.value = note.category;
  noteContent.value = note.content;
  notePin.checked = note.isPinned;
  btnDeleteNote.classList.remove("hidden");
  modal.classList.remove("hidden");
  noteTitle.focus();
}

function closeModal() {
  modal.classList.add("hidden");
  currentNoteId = null;
}

btnCloseModal.addEventListener("click", closeModal);
btnCancelModal.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

btnSaveNote.addEventListener("click", async () => {
  const title = noteTitle.value.trim();
  const content = noteContent.value.trim();
  const category = noteCategory.value;
  const isPinned = notePin.checked;

  if (!title && !content) {
    alert("Judul atau isi catatan tidak boleh kosong!");
    return;
  }

  btnSaveNote.disabled = true;
  btnSaveNote.textContent = "Menyimpan...";

  try {
    if (currentNoteId) {
      await updateDoc(doc(db, "notes", currentNoteId), {
        title, content, category, isPinned,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, "notes"), {
        userId: currentUser.uid,
        title, content, category, isPinned,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    closeModal();
  } catch (err) {
    alert("Gagal menyimpan: " + err.message);
  }

  btnSaveNote.disabled = false;
  btnSaveNote.textContent = "Simpan";
});

btnDeleteNote.addEventListener("click", async () => {
  if (!confirm("Hapus catatan ini?")) return;
  try {
    await deleteDoc(doc(db, "notes", currentNoteId));
    closeModal();
  } catch (err) {
    alert("Gagal menghapus: " + err.message);
  }
});

async function togglePin(id, currentPin) {
  try {
    await updateDoc(doc(db, "notes", id), {
      isPinned: !currentPin,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    alert("Gagal pin: " + err.message);
  }
}

function exportNote(note) {
  const date = note.createdAt?.toDate
    ? note.createdAt.toDate().toLocaleDateString("id-ID")
    : "Tanpa tanggal";

  const text = `CATATAN
========
Judul    : ${note.title || "Tanpa Judul"}
Kategori : ${note.category}
Tanggal  : ${date}
Pin      : ${note.isPinned ? "Ya" : "Tidak"}
========

${note.content}`;

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${note.title || "catatan"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}