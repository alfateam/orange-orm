var query = require('./query');
var toIntKey = require('./lock/toIntKey');

function lock(key, func) {
    key = toIntKey(key);
    if(typeof func === 'function') {
        return inLock(key, func);
    } else {
        var sql = 'SELECT pg_advisory_xact_lock(' + key + ')';
        return query(sql);
    }
}

async function inLock(key, func) {
    await query('SELECT pg_advisory_lock(' + key + ')');
    try {
        let result = await func();
        await query('SELECT pg_advisory_unlock(' + key + ')');
        return result;
    } catch(e) {
        await query('SELECT pg_advisory_unlock(' + key + ')');
        throw e;
    }
}

module.exports = lock;
