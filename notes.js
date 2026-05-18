// notes.js
import { auth } from "./firebase.js";
import { db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// =====================
// STATE
// =====================
let currentUser = null;
let allNotes = [];
let currentCategory = "Semua";
let currentNoteId = null;
let searchQuery = "";

// =====================
// ELEMENTS
// =====================
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

// Modal
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

// =====================
// AUTH CHECK
// =====================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUser = user;

  // Tampilkan info user
  userName.textContent = user.displayName;
  userName.classList.remove("hidden");

  const sidebarName = document.getElementById("sidebarName");
  if (sidebarName) sidebarName.textContent = user.displayName;

  if (user.photoURL) {
    userPhoto.src = user.photoURL;
    userPhoto.classList.remove("hidden");
  }

  // Load notes
  loadNotes();
});

// =====================
// LOGOUT
// =====================
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// =====================
// TOGGLE SIDEBAR
// =====================
btnToggleSidebar.addEventListener("click", () => {
  sidebar.classList.toggle("sidebar-hidden");
  mainContent.classList.toggle("main-expanded");
});

// =====================
// LOAD NOTES (Realtime)
// =====================
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

// =====================
// RENDER NOTES
// =====================
function renderNotes() {
  loadingState.classList.add("hidden");

  // Update total notes di sidebar
  const totalNotes = document.getElementById("totalNotes");
  if (totalNotes) totalNotes.textContent = allNotes.length;

  // Filter by category
  let filtered = currentCategory === "Semua"
    ? allNotes
    : allNotes.filter(n => n.category === currentCategory);

  // Filter by search
  if (searchQuery) {
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(searchQuery) ||
      n.content.toLowerCase().includes(searchQuery)
    );
  }

  // Update title & count
  pageTitle.textContent = currentCategory === "Semua" ? "Semua Catatan" : currentCategory;
  noteCount.textContent = `${filtered.length} catatan`;

  // Pisah pinned & unpinned
  const pinned = filtered.filter(n => n.isPinned);
  const unpinned = filtered.filter(n => !n.isPinned);

  // Render pinned
  if (pinned.length > 0) {
    pinnedSection.classList.remove("hidden");
    pinnedGrid.innerHTML = pinned.map(noteCard).join("");
  } else {
    pinnedSection.classList.add("hidden");
    pinnedGrid.innerHTML = "";
  }

  // Render unpinned
  if (unpinned.length > 0) {
    if (otherLabel) otherLabel.classList.toggle("hidden", pinned.length === 0);
    notesGrid.innerHTML = unpinned.map(noteCard).join("");
  } else {
    notesGrid.innerHTML = "";
    if (otherLabel) otherLabel.classList.add("hidden");
  }

  // Empty state
  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  // Click events pada cards
  document.querySelectorAll(".note-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".btn-pin") || e.target.closest(".btn-export")) return;
      const id = card.dataset.id;
      openEditModal(id);
    });
  });

  // Pin button events
  document.querySelectorAll(".btn-pin").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const note = allNotes.find(n => n.id === id);
      togglePin(id, note.isPinned);
    });
  });

  // Export button events
  document.querySelectorAll(".btn-export").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const note = allNotes.find(n => n.id === id);
      exportNote(note);
    });
  });
}

// =====================
// NOTE CARD TEMPLATE
// =====================
function noteCard(note) {
  const date = note.createdAt?.toDate
    ? note.createdAt.toDate().toLocaleDateString("id-ID", {
        day: "numeric", month: "short", year: "numeric"
      })
    : "Baru saja";

  const preview = note.content.length > 120
    ? note.content.substring(0, 120) + "..."
    : note.content;

  const categoryConfig = {
    Personal: { bg: "bg-blue-50", text: "text-blue-500" },
    Kerja:    { bg: "bg-purple-50", text: "text-purple-500" },
    Ide:      { bg: "bg-yellow-50", text: "text-yellow-500" },
    Penting:  { bg: "bg-red-50", text: "text-red-500" },
    Lainnya:  { bg: "bg-slate-50", text: "text-slate-500" },
  };

  const cfg = categoryConfig[note.category] || categoryConfig["Lainnya"];

  const cardAccents = {
    Personal: "border-t-4 border-t-blue-400",
    Kerja:    "border-t-4 border-t-purple-400",
    Ide:      "border-t-4 border-t-yellow-400",
    Penting:  "border-t-4 border-t-red-400",
    Lainnya:  "border-t-4 border-t-slate-400",
  };

  const accent = cardAccents[note.category] || cardAccents["Lainnya"];

  return `
    <div class="note-card ${accent} rounded-2xl p-5 cursor-pointer flex flex-col gap-3 shadow-sm"
      data-id="${note.id}">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-bold text-slate-800 text-base leading-snug flex-1">
          ${note.title || "Tanpa Judul"}
        </h3>
        <button class="btn-pin w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition text-base"
          data-id="${note.id}" title="${note.isPinned ? 'Lepas pin' : 'Sematkan'}">
          ${note.isPinned ? "📌" : "🔖"}
        </button>
      </div>
      <p class="text-slate-500 text-sm leading-relaxed flex-1">
        ${preview || "Tidak ada isi catatan"}
      </p>
      <div class="flex items-center justify-between pt-2 border-t border-slate-100">
        <span class="text-xs px-3 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.text}">
          ${note.category}
        </span>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400">${date}</span>
          <button class="btn-export w-7 h-7 rounded-full bg-slate-100 hover:bg-sky-100 hover:text-sky-500 flex items-center justify-center transition text-xs"
            data-id="${note.id}" title="Export">⬇️</button>
        </div>
      </div>
    </div>
  `;
}

// =====================
// CATEGORY FILTER
// =====================
document.querySelectorAll(".category-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active-category"));
    btn.classList.add("active-category");
    currentCategory = btn.dataset.category;
    renderNotes();
  });
});

// =====================
// SEARCH
// =====================
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  renderNotes();
});

// =====================
// OPEN MODAL (NEW)
// =====================
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

// =====================
// OPEN MODAL (EDIT)
// =====================
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

// =====================
// CLOSE MODAL
// =====================
function closeModal() {
  modal.classList.add("hidden");
  currentNoteId = null;
}

btnCloseModal.addEventListener("click", closeModal);
btnCancelModal.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

// =====================
// SAVE NOTE
// =====================
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

// =====================
// DELETE NOTE
// =====================
btnDeleteNote.addEventListener("click", async () => {
  if (!confirm("Hapus catatan ini?")) return;
  try {
    await deleteDoc(doc(db, "notes", currentNoteId));
    closeModal();
  } catch (err) {
    alert("Gagal menghapus: " + err.message);
  }
});

// =====================
// TOGGLE PIN
// =====================
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

// =====================
// EXPORT NOTE
// =====================
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