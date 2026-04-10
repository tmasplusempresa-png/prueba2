// Minimal shim for firebase/auth
function getAuth(){
  return { currentUser: null };
}

function onAuthStateChanged(_auth, callback){
  // immediately call with null (logged out)
  try { callback(null); } catch(e){}
  return () => {};
}

function signOut(){
  return Promise.resolve();
}

function signInWithEmailAndPassword(){
  return Promise.reject(new Error('Firebase auth shim: not implemented'));
}

module.exports = {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
};
