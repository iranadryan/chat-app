const socket = io();

const $messages = document.querySelector('#messages');
const $messageForm = document.querySelector('form');
const $messageInput = $messageForm.querySelector('input');
const $messageButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $sidebar = document.querySelector('#sidebar');

const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

function autoScroll() {
  // const $newMessage = $messages.lastElementChild;

  // const newMessageStyles = getComputedStyle($newMessage);
  // const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  // const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // const visibleHeight = $messages.offsetHeight;
  // const containerHeight = $messages.scrollHeight;
  // const scrollOffset = $messages.scrollTop + visibleHeight;

  // if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  // }
}

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('hh:mm A')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('locationMessage', (message) => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('hh:mm A')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  $messageButton.setAttribute('disabled', 'disabled');

  const message = e.target.message.value;

  $messageInput.focus();
  socket.emit('sendMessage', message, (err) => {
    $messageButton.removeAttribute('disabled');
    $messageInput.value = '';
    $messageInput.focus();

    if (err) {
      return console.log(err);
    }
  });
});

$locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.');
  }

  $locationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    }, () => {
      $locationButton.removeAttribute('disabled');
      console.log('Location shared');
    });
  });
});

socket.emit('join', { username, room }, (err) => {
  if (err) {
    alert(err);
    location.href = '/';
  }
});