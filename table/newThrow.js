var tryReleaseDbClient = require('./tryReleaseDbClient');

function newThrow(e, previousPromise) {
	return previousPromise.then(throwError, throwError);
	function throwError() {
		tryReleaseDbClient();
     	if (process.domain)
     		process.domain.exit();
		throw e;
	}
}

module.exports = newThrow;