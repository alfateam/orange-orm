var getSessionSingleton = require('./getSessionSingleton');
var deleteSessionContext = require('./deleteSessionContext');

function release(context) {
	var done = getSessionSingleton(context, 'dbClientDone');
	var pool = getSessionSingleton(context, 'pool');
	var locks = getSessionSingleton(context, 'advisoryLockNames');
	deleteSessionContext(context);
	if (done)
		done(locks?.size ? new Error('Discarding connection with unreleased advisory locks') : undefined);
	if (pool)
		return pool.end();

}

module.exports = release;
