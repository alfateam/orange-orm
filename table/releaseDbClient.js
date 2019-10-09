var getSessionSingleton = require('./getSessionSingleton');
var deleteSessionContext = require('./deleteSessionContext')

function release() {
	var done = getSessionSingleton('dbClientDone');
	var pool = getSessionSingleton('pool');
	deleteSessionContext();
	if (done)
		done();
	if (pool)
		return pool.end();
}

module.exports = release;