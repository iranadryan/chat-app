const { toCaptalize } = require('./string');

function generateMessage(username, text) {
  return {
    username: toCaptalize(username),
    text,
    createdAt: new Date().getTime()
  };
}

function generateLocationMessage(username, url) {
  return {
    username: toCaptalize(username),
    url,
    createdAt: new Date().getTime()
  };
}

module.exports = {
  generateMessage,
  generateLocationMessage
};