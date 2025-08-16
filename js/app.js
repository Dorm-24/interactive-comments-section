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
  wrapper.innerHTML = '';

  generateComments();

  wrapper.appendChild(generateInputFieldHTML(appData.currentUser));
}

function generateComments() {
  if (!appData.comments) {
    return;
  }

  const commentsList = document.createElement('section');
  commentsList.className = 'comments-list';

  appData.comments.forEach(comment => {
    commentsList.appendChild(generateComment(comment));
  });

  wrapper.appendChild(commentsList);
}

function generateComment(comment, isReply = false) {
  const isCurrentUser = comment.user.username === appData.currentUser.username;

  const usernameGroup = !isCurrentUser
    ? `
      <div class="username-group">
        <p class="username">${comment.user.username}</p>
      </div>
    `
    : `
      <div class="username-group">
        <p class="username">${comment.user.username}</p>
        <span class="label">you</span>
      </div>
    `;

  const actionButtons = !isCurrentUser
    ? `<p class="reply-button"><img src="./images/icon-reply.svg" alt=""> Reply</p>`
    : `
      <div class="reply-buttons">
        <p class="reply-button delete"><img src="./images/icon-delete.svg" alt=""> Delete</p>
        <p class="reply-button edit"><img src="./images/icon-edit.svg" alt=""> Edit</p>
      </div>
    `;

  const mainCommentHTML = `
    <div class="score">
      <svg width="11" height="11" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.33 10.896c.137 0 .255-.05.354-.149.1-.1.149-.217.149-.354V7.004h3.315c.136 0 .254-.05.354-.149.099-.1.148-.217.148-.354V5.272a.483.483 0 0 0-.148-.354.483.483 0 0 0-.354-.149H6.833V1.4a.483.483 0 0 0-.149-.354.483.483 0 0 0-.354-.149H4.915a.483.483 0 0 0-.354.149c-.1.1-.149.217-.149.354v3.37H1.08a.483.483 0 0 0-.354.15c-.1.099-.149.217-.149.353v1.23c0 .136.05.254.149.353.1.1.217.149.354.149h3.333v3.39c0 .136.05.254.15.353.098.1.216.149.353.149H6.33Z" fill="hsl(239, 57%, 85%)" />
      </svg>
      <p class="score-counter">${comment.score}</p>
      <svg width="11" height="3" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.256 2.66c.204 0 .38-.056.53-.167.148-.11.222-.243.222-.396V.722c0-.152-.074-.284-.223-.395a.859.859 0 0 0-.53-.167H.76a.859.859 0 0 0-.53.167C.083.437.009.57.009.722v1.375c0 .153.074.285.223.396a.859.859 0 0 0 .53.167h8.495Z" fill="hsl(239, 57%, 85%)" />
      </svg>
    </div>

    <div class="user-details">
      <img src="${comment.user.image.png}" alt="${comment.user.username}" class="profile-pic">
      ${usernameGroup}
      <p class="time-created">${comment.createdAt}</p>
    </div>

    ${actionButtons}

    <p class="content">${comment.content}</p>
  `;

  let outerEl;

  if (isReply) {
    outerEl = document.createElement('div');
    outerEl.className = 'main-comment';
    outerEl.innerHTML = mainCommentHTML;
  }
  else {
    outerEl = document.createElement('article');
    outerEl.className = 'comment-container';

    const main = document.createElement('div');
    main.className = 'main-comment';
    main.innerHTML = mainCommentHTML;

    outerEl.appendChild(main);
  }

  if (comment.replies) {
    const replyContainer = document.createElement('div');
    replyContainer.className = 'reply-container';

    const line = document.createElement('div');
    line.className = 'line';

    const replyList = document.createElement('div');
    replyList.className = 'reply-list';

    comment.replies.forEach(reply => {
      replyList.appendChild(generateComment(reply, true));
    });

    replyContainer.appendChild(line);
    replyContainer.appendChild(replyList);

    outerEl.appendChild(replyContainer);
  }

  return outerEl;
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
