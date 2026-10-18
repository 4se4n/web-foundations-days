// Global Constants & Elements
const API_URL = 'https://jsonplaceholder.typicode.com/posts';

const loadBtn = document.querySelector('#load-btn');
const submitBtn = document.querySelector('#submit-btn');
const noteForm = document.querySelector('#note-form');
const titleInput = document.querySelector('#title-input');
const bodyInput = document.querySelector('#body-input');
const statusP = document.querySelector('#status');
const notesList = document.querySelector('#notes-list');

// In-memory array holding notes currently rendered on screen
let localNotes = [];

// Helper function to update status UI element
function setStatus(message, stateClass) {
  statusP.textContent = message;
  statusP.className = stateClass; // 'loading', 'success', or 'error'
}

// Reusable fetch wrapper function with centralized response checking
async function request(url, options = {}) {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP Error! Status: ${response.status} (${response.statusText})`);
  }
  
  // Return empty object for empty 204 responses, otherwise parse JSON
  if (response.status === 204) return {};
  return await response.json();
}

// Safe rendering function using createElement and textContent exclusively
function render() {
  notesList.textContent = ''; // Reset UI list safely

  if (localNotes.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'empty-msg';
    emptyLi.textContent = 'No notes available. Click "Load Notes" or create one above!';
    notesList.appendChild(emptyLi);
    return;
  }

  localNotes.forEach(note => {
    const li = document.createElement('li');
    li.className = 'note-item';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'note-content';

    const h3 = document.createElement('h3');
    h3.className = 'note-title';
    h3.textContent = note.title; // Safe against XSS

    const p = document.createElement('p');
    p.className = 'note-body';
    p.textContent = note.body || '(No body content)'; // Safe against XSS

    contentDiv.appendChild(h3);
    contentDiv.appendChild(p);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deleteNote(note.id, li));

    li.appendChild(contentDiv);
    li.appendChild(delBtn);

    notesList.appendChild(li);
  });
}

// 1. GET Request: Load 10 notes from server
async function loadNotes() {
  setStatus('Loading notes...', 'loading');
  loadBtn.disabled = true;

  try {
    const data = await request(`${API_URL}?_limit=10`);
    localNotes = data;
    render();
    setStatus(`Loaded ${localNotes.length} notes from the server.`, 'success');
  } catch (error) {
    console.error('Fetch error:', error);
    setStatus(`Failed to load notes: ${error.message}`, 'error');
  } finally {
    loadBtn.disabled = false;
  }
}

// 2. POST Request: Create a new note
async function createNote(e) {
  e.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  // Validation
  if (!title) {
    setStatus('Title is required!', 'error');
    return;
  }

  if (title.length > 100) {
    setStatus('Title cannot exceed 100 characters!', 'error');
    return;
  }

  setStatus('Creating note...', 'loading');
  submitBtn.disabled = true;

  try {
    const newNotePayload = { title, body, userId: 1 };
    
    // Perform POST request
    const responseData = await request(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotePayload)
    });

    // JSONPlaceholder returns standard created object with assigned ID (e.g., 101)
    const createdNote = {
      id: responseData.id || Date.now(),
      title: title,
      body: body
    };

    localNotes.unshift(createdNote); // Prepend to top of array
    render();
    
    // Clear form inputs
    titleInput.value = '';
    bodyInput.value = '';
    
    setStatus(`Note created (status 201, id ${createdNote.id}).`, 'success');
  } catch (error) {
    console.error('Create error:', error);
    setStatus(`Failed to create note: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
  }
}

// 3. DELETE Request: Remove a note
async function deleteNote(id, elementRef) {
  setStatus(`Deleting note #${id}...`, 'loading');

  try {
    await request(`${API_URL}/${id}`, { method: 'DELETE' });

    /* 
      NOTE ON JSONPLACEHOLDER DELETION BEHAVIOR:
      JSONPlaceholder is a mock REST API. Sending a DELETE request returns 
      an HTTP 200/204 response confirming success, but it does not permanently 
      modify the backend database. To keep the UI state consistent, we manually 
      filter the deleted note out of our local array upon HTTP request success.
    */
    localNotes = localNotes.filter(n => n.id !== id);
    render();

    setStatus(`Note #${id} successfully deleted from server.`, 'success');
  } catch (error) {
    console.error('Delete error:', error);
    setStatus(`Failed to delete note #${id}: ${error.message}`, 'error');
  }
}

// Attach Event Listeners
loadBtn.addEventListener('click', loadNotes);
noteForm.addEventListener('submit', createNote);

// Initial empty state render
render();