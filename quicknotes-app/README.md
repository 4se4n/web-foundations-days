# QuickNotes App

QuickNotes is a clean, lightweight web application designed to help users quickly capture, categorize, and organize their personal thoughts, tasks, and study topics directly in their browser.

## Features

- **Categorized Note Creation**: Add notes categorized into Personal, Work, or Study.
- **Visual Styling**: Color-coded left borders for quick visual distinction between categories.
- **Live Search Filtering**: Real-time filtering of notes as you type search keywords.
- **Data Persistence**: Automatic saving and retrieval of notes using browser `localStorage`.
- **Validation Controls**: Character checks enforcing non-empty inputs and a maximum of 200 characters.
- **Responsive Design**: Mobile-friendly layout using CSS Flexbox and media queries.
- **Bulk Action**: Clear all notes simultaneously with confirmation.

## How to Run Locally

1. Clone or download this repository to your local computer.
2. Open the project folder in your code editor.
3. Open `index.html` directly in any web browser (or use a local server like VS Code Live Server).

## What I Learned

- **DOM Manipulation with Security**: Utilizing `document.createElement()` and `textContent` instead of `innerHTML` to eliminate XSS vulnerabilities when displaying user input.
- **Data Persistence with Web Storage**: Implementing `JSON.stringify()` and `JSON.parse()` to persist state within `localStorage` across page reloads.
- **Flexbox & Media Query Layouts**: Designing responsive UI components that seamlessly stack on mobile devices (`max-width: 600px`).