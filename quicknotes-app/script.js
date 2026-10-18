// DOM Element Selection using querySelector
const noteForm = document.querySelector('#note-form');
const noteInput = document.querySelector('#note-input');
const noteCategory = document.querySelector('#note-category');
const errorMessage = document.querySelector('#error-message');
const searchInput = document.querySelector('#search-input');
const notesList = document.querySelector('#notes-list');
const noteCount = document.querySelector('#note-count');
const clearAllBtn = document.querySelector('#clear-all-btn');

// Initial state array loaded from LocalStorage
let notes = JSON.parse(localStorage.getItem('quicknotes_data')) || [];

// Save notes array to LocalStorage
function saveNotes() {
  localStorage.setItem('quicknotes_data', JSON.stringify(notes));
}

// Update the note count paragraph
function updateNoteCount(displayedCount = notes.length) {
  if (notes.length === 0) {
    noteCount.textContent = "You have no notes yet.";
  } else if (displayedCount === 1) {
    noteCount.textContent = "You have 1 note.";
  } else {
    noteCount.textContent = `You have ${displayedCount} notes.`;
  }
}

// Render function rebuilding the list securely using createElement & textContent
function render() {
  notesList.textContent = ''; // Clear current list DOM elements
  const query = searchInput.value.toLowerCase().trim();

  // Filter notes based on search input
  const filteredNotes = notes.filter(note => 
    note.text.toLowerCase().includes(query)
  );

  if (filteredNotes.length === 0 && notes.length > 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'no-notes-msg';
    emptyLi.textContent = 'No notes match your search.';
    notesList.appendChild(emptyLi);
  } else {
    filteredNotes.forEach(note => {
      const li = document.createElement('li');
      li.className = `note-card category-${note.category.toLowerCase()}`;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'note-content';

      const textP = document.createElement('p');
      textP.className = 'note-text';
      textP.textContent = note.text; // Safe from XSS injection

      const metaDiv = document.createElement('div');
      metaDiv.className = 'note-meta';

      const categoryBadge = document.createElement('span');
      categoryBadge.className = 'badge';
      categoryBadge.textContent = note.category;

      const dateSpan = document.createElement('span');
      dateSpan.textContent = note.createdAt;

      metaDiv.appendChild(categoryBadge);
      metaDiv.appendChild(dateSpan);

      contentDiv.appendChild(textP);
      contentDiv.appendChild(metaDiv);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deleteNote(note.id));

      li.appendChild(contentDiv);
      li.appendChild(deleteBtn);

      notesList.appendChild(li);
    });
  }

  updateNoteCount(filteredNotes.length);
}

// Add Note Handler
noteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = noteInput.value.trim();

  // Validation
  if (text === '') {
    errorMessage.textContent = 'Please type a note first.';
    return;
  }

  if (text.length > 200) {
    errorMessage.textContent = 'Notes must be 200 characters or fewer.';
    return;
  }

  // Clear validation error if input is valid
  errorMessage.textContent = '';

  const newNote = {
    id: Date.now(),
    text: text,
    category: noteCategory.value,
    createdAt: new Date().toLocaleString()
  };

  notes.unshift(newNote); // Add to beginning of list
  saveNotes();
  render();

  noteInput.value = ''; // Reset input field
});

// Delete individual note
function deleteNote(id) {
  notes = notes.filter(note => note.id !== id);
  saveNotes();
  render();
}

// Search input event listener
searchInput.addEventListener('input', render);

// Bonus Feature: Clear all notes with confirmation prompt
clearAllBtn.addEventListener('click', () => {
  if (notes.length === 0) return;
  
  if (confirm("Delete all notes?")) {
    notes = [];
    saveNotes();
    render();
  }
});

// Initial Render on Page Load
render();