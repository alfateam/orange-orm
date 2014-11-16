var getSessionSingleton = require('./getSessionSingleton');
var deleteSessionContext = require('./deleteSessionContext')

function release() {
	var done = getSessionSingleton('dbClientDone');
	deleteSessionContext();
	if (done)
		done();
}

module.exports = release;