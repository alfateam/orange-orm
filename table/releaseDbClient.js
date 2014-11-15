var getSessionSingleton = require('./getSessionSingleton');

function release() {
	var done = getSessionSingleton('dbClientDone');
	if (done)
		done();
}

module.exports = release;