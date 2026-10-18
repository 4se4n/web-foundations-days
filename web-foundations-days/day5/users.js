const loadBtn = document.getElementById('load-users');
const filterInput = document.getElementById('filter-input');
const statusP = document.getElementById('status');
const usersList = document.getElementById('users-list');

let loadedUsers = [];

// Render function to display array of users safely using createElement and textContent
function renderUsers(users) {
  usersList.textContent = ''; // Clear current list

  if (users.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.textContent = 'No users match your filter.';
    usersList.appendChild(emptyLi);
    return;
  }

  users.forEach(user => {
    const li = document.createElement('li');
    
    // Format required details: name, email, city, company name
    li.textContent = `${user.name} | Email: ${user.email} | City: ${user.address.city} | Company: ${user.company.name}`;
    
    usersList.appendChild(li);
  });
}

// Async function to fetch users from JSONPlaceholder API
async function loadUsers() {
  // Update status and disable button while loading
  statusP.textContent = 'Loading users...';
  loadBtn.disabled = true;

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    loadedUsers = data;

    statusP.textContent = 'Users loaded successfully!';
    renderUsers(loadedUsers);
  } catch (error) {
    statusP.textContent = 'Failed to load users. Please try again.';
    console.error('Fetch error:', error);
  } finally {
    // Re-enable button
    loadBtn.disabled = false;
  }
}

// Client-side filtering without making new API requests
filterInput.addEventListener('input', () => {
  const query = filterInput.value.toLowerCase().trim();
  const filtered = loadedUsers.filter(user =>
    user.name.toLowerCase().includes(query)
  );
  renderUsers(filtered);
});

// Event listener for Load Users button
loadBtn.addEventListener('click', loadUsers);