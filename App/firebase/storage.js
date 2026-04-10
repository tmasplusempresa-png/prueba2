// Minimal shim for firebase/storage
function getStorage(){
  return {};
}

function ref(_storage, _path){
  return { _path };
}

function uploadBytes(_ref, _data){
  return Promise.resolve({ ref: _ref });
}

function getDownloadURL(_ref){
  return Promise.resolve('');
}

module.exports = { getStorage, ref, uploadBytes, getDownloadURL };
