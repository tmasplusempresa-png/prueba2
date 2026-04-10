// Minimal shim for firebase/messaging
function getMessaging(){
  return {};
}

function getToken(){
  return Promise.resolve('');
}

function onMessage(){
  // no-op
}

module.exports = { getMessaging, getToken, onMessage };
