const wrapper = document.getElementById('wrapper');
let appData = null;

document.addEventListener('DOMContentLoaded', async () => {
  appData = await loadInitialData();
  console.log(appData);

  renderApp();
});

async function loadInitialData() {
  const saved = localStorage.getItem('commentsData');
  if (saved) {
    return JSON.parse(saved);
  }

  try {
    const response = await fetch('./data/data.json');

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    data.comments = data.comments || [];

    return data;

  } catch (error) {
    console.error('Failed to load data.json', error);
    return { currentUser: { username: 'you', image: { png: '' } }, comments: [] };
  }
}

function saveData() {
  localStorage.setItem('commentsData', JSON.stringify(appData));
}

function renderApp() {
  // wrapper.innerHTML = '';

  wrapper.appendChild(generateInputFieldHTML(appData.currentUser));

}

function generateInputFieldHTML(currentUser) {
  const div = document.createElement('div');
  div.className = 'input-field-you comment-container-input';
  div.innerHTML = `
    <img src="${currentUser.image.png}" alt="${currentUser.username}" class="profile-pic">
    <textarea id="inputYou" placeholder="Add a comment..."></textarea>
    <button id="sendBtn" class="button">Send</button>
  `;
  return div;
}
