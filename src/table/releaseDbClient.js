var getSessionSingleton = require('./getSessionSingleton');
var deleteSessionContext = require('./deleteSessionContext');

function release(context) {
	var done = getSessionSingleton(context, 'dbClientDone');
	var pool = getSessionSingleton(context, 'pool');
	deleteSessionContext(context);
	if (done)
		done();
	if (pool)
		return pool.end();

}

module.exports = release;