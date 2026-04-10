// Minimal shim for firebase/database to allow app to bundle when using Supabase instead
// These functions are no-op or return empty values. Replace with real Supabase adapters as needed.
function ref(path) {
  return { _path: path };
}

async function get(_ref) {
  // Return an object similar to Firebase snapshot
  return {
    exists: () => false,
    val: () => null,
  };
}

function onValue(_ref, callback) {
  // Immediately call callback with a snapshot that has no data
  const snapshot = { exists: () => false, val: () => null };
  try { callback(snapshot); } catch (e) { /* ignore */ }
  // return unsubscribe function
  return () => {};
}

function push(_ref, value) {
  // Return a pseudo reference
  return Promise.resolve({ key: 'shim-key', val: () => value });
}

function set(_ref, value) {
  return Promise.resolve();
}

function update(_ref, value) {
  return Promise.resolve();
}

function remove(_ref) {
  return Promise.resolve();
}

function query(_ref, _){
  return _ref;
}

function orderByChild(){return null}
function equalTo(){return null}
function child(_ref, childPath){ return { _path: _ref._path + '/' + childPath }; }
function off(){ return; }
function getDatabase(){ return {}; }
function limitToLast(){ return; }

module.exports = {
  ref,
  get,
  onValue,
  push,
  set,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  child,
  off,
  getDatabase,
  limitToLast,
};
