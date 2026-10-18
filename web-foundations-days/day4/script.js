// DOM Element Selection
const noteText = document.getElementById('note-text');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const clearBtn = document.getElementById('clear-btn');
const themeToggle = document.getElementById('theme-toggle');

// Helper function to update character and word counters + CSS warning/over classes
function updateCounts() {
  const text = noteText.value;
  const numChars = text.length;

  // Calculate word count (ignoring empty whitespace)
  const trimmedText = text.trim();
  const numWords = trimmedText === '' ? 0 : trimmedText.split(/\s+/).length;

  // Update text content
  charCount.textContent = `${numChars} / 200 characters`;
  wordCount.textContent = `${numWords} ${numWords === 1 ? 'word' : 'words'}`;

  // Reset indicator classes
  charCount.classList.remove('warning', 'over');

  // Apply warning (>180) or over (>200) styling
  if (numChars > 200) {
    charCount.classList.add('over');
  } else if (numChars > 180) {
    charCount.classList.add('warning');
  }
}

// Function to clear textarea and reset draft
function clearAll() {
  noteText.value = '';
  localStorage.removeItem('noteDraft');
  updateCounts();
}

// Event Listeners

// 1. On input: update counters and store draft in localStorage
noteText.addEventListener('input', () => {
  updateCounts();
  localStorage.setItem('noteDraft', noteText.value);
});

// 2. Clear button click event
clearBtn.addEventListener('click', clearAll);

// 3. Keydown listener for Escape key inside the textarea
noteText.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    clearAll();
  }
});

// 4. Theme button toggle and state persistence
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');

  const isDark = document.body.classList.contains('dark');
  themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Initial load handler to restore draft and theme state
window.addEventListener('DOMContentLoaded', () => {
  // Restore draft text
  const savedDraft = localStorage.getItem('noteDraft');
  if (savedDraft !== null) {
    noteText.value = savedDraft;
  }

  // Restore saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = 'Light mode';
  } else {
    document.body.classList.remove('dark');
    themeToggle.textContent = 'Dark mode';
  }

  // Update counters based on restored text
  updateCounts();
});