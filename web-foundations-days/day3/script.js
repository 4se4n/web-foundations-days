let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
  const searchTerm = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(searchTerm));
}

function longestNote() {
  if (notes.length === 0) return null;
  return notes.reduce((longest, current) => {
    return current.text.length > longest.text.length ? current : longest;
  });
}

function countByCategory() {
  const counts = {};
  for (const note of notes) {
    counts[note.category] = (counts[note.category] || 0) + 1;
  }
  return counts;
}

function getSummary() {
  const total = notes.length;
  const counts = countByCategory();

  const noteWord = total === 1 ? "note" : "notes";
  const personal = counts.personal || 0;
  const work = counts.work || 0;
  const study = counts.study || 0;

  return `${total} ${noteWord}: ${personal} personal, ${work} work, ${study} study.`;
}

function isDuplicate(text) {
  const normalizedInput = text.trim().toLowerCase();
  return notes.some(
    (note) => note.text.trim().toLowerCase() === normalizedInput
  );
}

function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];

  if (!text || text.length < 1 || text.length > 200) {
    console.log("Failed to add note: Text must be between 1 and 200 characters.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log(`Failed to add note: Category must be one of ${validCategories.join(", ")}.`);
    return false;
  }

  if (isDuplicate(text)) {
    console.log("Failed to add note: Duplicate note text already exists.");
    return false;
  }

  const newId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1;
  notes.push({ id: newId, text: text, category: category });
  return true;
}

// Testing Functions with Console Logs


console.log("--- Testing searchNotes ---");
// Normal case
console.log(searchNotes("javascript"));
// Expected : Array with 1 note object (id: 4, "Revise JavaScript arrays")

// Edge case: search term with no matching results
console.log(searchNotes("python"));
// Expected : []

console.log("\n--- Testing longestNote ---");
// Normal case: find the longest note
console.log(longestNote());
// Expected : { id: 3, text: "Email the project report to Grace", category: "work" }

// Edge case: array is empty
const originalNotes = [...notes];
notes = [];
console.log(longestNote());
// Expected : null
notes = [...originalNotes]; // Restore original notes array

console.log("\n--- Testing countByCategory ---");
// Normal case: count categories in populated array
console.log(countByCategory());
// Expected : { personal: 2, study: 2, work: 1 }

// Edge case: count when notes array has only one entry
notes = [{ id: 1, text: "Single note", category: "work" }];
console.log(countByCategory());
// Expected : { work: 1 }
notes = [...originalNotes]; // Restore original notes array

console.log("\n--- Testing getSummary ---");
// Normal case: multiple notes summary
console.log(getSummary());
// Expected : "5 notes: 2 personal, 1 work, 2 study."

// Edge case: single note summary (checks "note" vs "notes")
notes = [{ id: 1, text: "Only one", category: "personal" }];
console.log(getSummary());
// Expected : "1 note: 1 personal, 0 work, 0 study."
notes = [...originalNotes]; // Restore original notes array

console.log("\n--- Testing isDuplicate ---");
// Normal case: check existing note with different casing/spacing
console.log(isDuplicate("  call MUM "));
// Expected : true

// Edge case: check non-existent note
console.log(isDuplicate("Buy grocery items"));
// Expected : false

console.log("\n--- Testing addNote ---");
// Normal case: add a valid new note
console.log(addNote("Read a chapter of a book", "study"));
// Expected : true (and adds note to array)

// Edge case: attempt to add duplicate note (should log reason and return false)
console.log(addNote("Call mum", "personal"));
// Expected : "Failed to add note: Duplicate note text already exists." followed by false