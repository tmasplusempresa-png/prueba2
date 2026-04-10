// Simple index re-exporting shims
exports.database = require('./database');
exports.auth = require('./auth');
exports.storage = require('./storage');
exports.messaging = require('./messaging');

// also export top-level helpers used elsewhere
exports.ref = exports.database.ref;
exports.get = exports.database.get;
exports.onValue = exports.database.onValue;
exports.push = exports.database.push;
exports.set = exports.database.set;
exports.update = exports.database.update;
exports.remove = exports.database.remove;
exports.getAuth = exports.auth.getAuth;
