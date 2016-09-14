var query = require('./query');
var toIntKey = require('./lock/toIntKey');

function lock(key) {
    key = toIntKey(key);
    var sql = 'SELECT pg_advisory_xact_lock(' + key + ')';
    return query(sql);
}

module.exports = lock;
