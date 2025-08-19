const wrapper = document.getElementById('wrapper');
let appData = null;

document.addEventListener('DOMContentLoaded', async () => {
  appData = await loadInitialData();

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
    ? `<p class="reply-button" onclick="replyComment(${comment.id}, this)"><img src="./images/icon-reply.svg" alt=""> Reply</p>`
    : `
      <div class="reply-buttons">
        <p class="reply-button delete" onclick="confirmDelete(${comment.id})"><img src="./images/icon-delete.svg" alt=""> Delete</p>
        <p class="reply-button edit" onclick="editComment(${comment.id}, this)"><img src="./images/icon-edit.svg" alt=""> Edit</p>
      </div>
    `;

  const replyUsername = isReply ? `<span class="reply-username">@${comment.replyingTo} </span>` : '';

  const mainCommentHTML = `
    <div class="score">
      <svg width="11" height="11" xmlns="http://www.w3.org/2000/svg" onclick="upvote(${comment.id})" ${comment.voters?.includes(appData.currentUser.username) ? "disabled" : ""}>
        <path d="M6.33 10.896c.137 0 .255-.05.354-.149.1-.1.149-.217.149-.354V7.004h3.315c.136 0 .254-.05.354-.149.099-.1.148-.217.148-.354V5.272a.483.483 0 0 0-.148-.354.483.483 0 0 0-.354-.149H6.833V1.4a.483.483 0 0 0-.149-.354.483.483 0 0 0-.354-.149H4.915a.483.483 0 0 0-.354.149c-.1.1-.149.217-.149.354v3.37H1.08a.483.483 0 0 0-.354.15c-.1.099-.149.217-.149.353v1.23c0 .136.05.254.149.353.1.1.217.149.354.149h3.333v3.39c0 .136.05.254.15.353.098.1.216.149.353.149H6.33Z" fill="hsl(239, 57%, 85%)" />
      </svg>
      <p class="score-counter">${comment.score}</p>
      <svg width="11" height="3" xmlns="http://www.w3.org/2000/svg" onclick="downvote(${comment.id})" ${comment.voters?.includes(appData.currentUser.username) ? "disabled" : ""}>
        <path d="M9.256 2.66c.204 0 .38-.056.53-.167.148-.11.222-.243.222-.396V.722c0-.152-.074-.284-.223-.395a.859.859 0 0 0-.53-.167H.76a.859.859 0 0 0-.53.167C.083.437.009.57.009.722v1.375c0 .153.074.285.223.396a.859.859 0 0 0 .53.167h8.495Z" fill="hsl(239, 57%, 85%)" />
      </svg>
    </div>

    <div class="user-details">
      <img src="${comment.user.image.png}" alt="${comment.user.username}" class="profile-pic">
      ${usernameGroup}
      <p class="time-created">${comment.createdAt}</p>
    </div>

    ${actionButtons}

    <div class="content">
      <p>${replyUsername + comment.content}</p>
    </div>
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

  if (comment.replies && comment.replies.length > 0) {
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
  div.className = 'input-field-you';
  div.innerHTML = `
    <img src="${currentUser.image.png}" alt="${currentUser.username}" class="profile-pic">
    <textarea class="input-textarea" placeholder="Add a comment..." id="inputTextarea" name="inputTextarea"></textarea>
    <button class="button" onclick="sendComment()">Send</button>
  `;
  return div;
}

function sendComment() {
  let value = document.querySelector('.input-textarea').value.trim();

  if (value == '') {
    return;
  }

  appData.comments.push({
    id: generateId(),
    content: value,
    createdAt: 'Just now',
    score: 0,
    user: appData.currentUser,
    replies: [],
    voters: []
  });

  value = '';
  saveData();
  renderApp();
}

function generateId() {
  let commentsCounter = 0;
  let replyCounter = 0;

  appData.comments.forEach(comment => {
    commentsCounter++;
    replyCounter += comment.replies.length;
  });

  // all comments + the new one
  const id = (commentsCounter + replyCounter) + 1;

  return id;
}

function confirmDelete(id) {
  const dialog = document.createElement('section');
  dialog.className = 'delete-confirmation-container';
  dialog.innerHTML = `
    <div class="delete-confirmation">
      <h2>Delete comment</h2>
      <p>Are you sure you want to delete this comment? This will remove the comment and can't be undone.</p>
      <div class="confirmation-buttons">
        <button class="cancel">no, cancel</button>
        <button class="confirm">yes, delete</button>
      </div>
    </div>
  `;
  wrapper.appendChild(dialog);

  dialog.addEventListener('click', function (e) {
    if (e.target == this || e.target.matches('.cancel')) {
      dialog.remove();
    }

    if (e.target.matches('.confirm')) {
      deleteComment(id);
      dialog.remove();
    }
  });
}

function deleteComment(id) {
  appData.comments.forEach(comment => {
    if (comment.replies && comment.replies.length > 0) {
      comment.replies = comment.replies.filter(reply => reply.id !== id);
    }
  });

  appData.comments = appData.comments.filter(comment => comment.id !== id);

  saveData();
  renderApp();
}

let activeReplyEl = null;
let activeEditEl = null;
let documentClickListener = null;

function editComment(id, el) {
  if (activeEditEl) {
    const { commentEl, contentEl } = activeEditEl;
    commentEl.replaceChild(contentEl, commentEl.querySelector('.edit-field'));
    activeEditEl = null;
  }

  const comment = findCommentById(id, appData.comments);
  const commentEl = el.closest('.main-comment');
  const contentEl = commentEl.querySelector('.content');

  const editField = document.createElement('div');
  editField.className = 'content edit-field';
  editField.innerHTML = `
    <textarea class="input-textarea" name="editInput">@${comment.replyingTo} ${comment.content}</textarea>
    <button class="button update-button" onclick="updateComment(${id}, this)">Update</button>
  `;

  commentEl.replaceChild(editField, contentEl);
  activeEditEl = { commentEl, contentEl };

  if (documentClickListener) {
    document.removeEventListener('mousedown', documentClickListener);
  }
  documentClickListener = handleOutsideClick;
  document.addEventListener('mousedown', documentClickListener);

  const textarea = editField.querySelector('.input-textarea');
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

function closeEditField() {
  if (activeEditEl) {
    const { commentEl, contentEl } = activeEditEl;
    commentEl.replaceChild(contentEl, commentEl.querySelector('.edit-field'));
    activeEditEl = null;
  }

  if (documentClickListener) {
    document.removeEventListener('mousedown', documentClickListener);
    documentClickListener = null;
  }
}

function updateComment(id, el) {
  const comment = findCommentById(id, appData.comments);
  const textarea = el.previousElementSibling;
  let newValue = textarea.value.trim();

  if (newValue === '') {
    return;
  }

  if (newValue.startsWith('@')) {
    const spaceIndex = newValue.indexOf(' ');
    if (spaceIndex !== -1) {
      newValue = newValue.substring(spaceIndex + 1).trim();
    }
  }

  comment.content = newValue;

  if (comment.content.startsWith('@')) {
    return;
  }

  saveData();
  renderApp();
}

function handleOutsideClick(e) {
  if (activeEditEl && !activeEditEl.commentEl.contains(e.target)) {
    closeEditField();
  }

  if (!e.target.closest('.reply-input-field') && !e.target.closest('.reply-button')) {
    closeReplyField();
  }
}

function replyComment(id, el) {
  if (activeReplyEl) {
    closeReplyField();
  }

  const replyContainer = document.createElement('div');
  replyContainer.className = 'input-field-you reply-input-field';
  replyContainer.innerHTML = `
    <img src="${appData.currentUser.image.png}" alt="${appData.currentUser.username}" class="profile-pic">
    <textarea class="input-textarea" placeholder="Add a comment..." id="replyTextarea"></textarea>
    <button class="button" onclick="sendReply(${id}, this)">Reply</button>
  `;

  const commentEl = el.closest('.comment-container, .main-comment');
  commentEl.insertAdjacentElement("afterend", replyContainer);

  activeReplyEl = replyContainer;

  if (!documentClickListener) {
    documentClickListener = handleOutsideClick;
    document.addEventListener('click', documentClickListener);
  }

  const replyToUsername = findCommentById(id, appData.comments).user.username;

  const textarea = replyContainer.querySelector('.input-textarea');
  textarea.value = `@${replyToUsername} `;
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

function sendReply(id, el) {
  let value = el.previousElementSibling.value.trim();

  if (value == '') {
    return;
  }

  if (value.startsWith('@')) {
    const spaceIndex = value.indexOf(' ');
    if (spaceIndex !== -1) {
      value = value.substring(spaceIndex + 1).trim();
    }
  }

  if (value.startsWith('@')) {
    return;
  }

  const replyToUsername = findCommentById(id, appData.comments).user.username;

  const newReply = {
    id: generateId(),
    content: value,
    createdAt: 'Just now',
    score: 0,
    replyingTo: replyToUsername,
    user: appData.currentUser,
    voters: []
  };

  for (const comment of appData.comments) {
    if (comment.replies) {
      const replyIndex = comment.replies.findIndex(r => r.id === id);
      if (replyIndex !== -1) {
        comment.replies.splice(replyIndex + 1, 0, newReply);
        break;
      }
    }

    if (comment.id === id) {
      comment.replies = comment.replies || [];
      comment.replies.push(newReply);
      break;
    }
  }

  saveData();
  closeReplyField();
  renderApp();
}

function closeReplyField() {
  if (activeReplyEl) {
    activeReplyEl.remove();
    activeReplyEl = null;
  }

  if (documentClickListener) {
    document.removeEventListener('click', documentClickListener);
    documentClickListener = null;
  }
}

function upvote(id) {
  const comment = findCommentById(id, appData.comments);

  if (!comment.voters) {
    comment.voters = [];
  }

  if (!comment.voters.includes(appData.currentUser.username)) {
    comment.score++;
    comment.voters.push(appData.currentUser.username);
  }

  saveData();
  renderApp();
}

function downvote(id) {
  const comment = findCommentById(id, appData.comments);

  if (!comment.voters) {
    comment.voters = [];
  }

  const voterIndex = comment.voters.indexOf(appData.currentUser.username);

  if (comment.voters.includes(appData.currentUser.username)) {
    comment.score--;
    comment.voters.splice(voterIndex, 1);
  }

  saveData();
  renderApp();
}

function findCommentById(id, comments) {
  for (const comment of comments) {
    if (comment.id === id) {
      return comment;
    }

    if (comment.replies && comment.replies.length > 0) {
      const found = findCommentById(id, comment.replies);

      if (found) {
        return found;
      }
    }
  }

  return null;
}
