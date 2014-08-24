var setSessionSingleton = require('./setSessionSingleton');
module.exports = setSessionSingleton.bind(null, 'isDirty', true);