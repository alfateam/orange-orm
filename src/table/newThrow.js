var tryReleaseDbClient = require('./tryReleaseDbClient');

function newThrow(e, previousPromise) {
	return previousPromise.then(throwError, throwError);
	function throwError() {
		tryReleaseDbClient();
		throw e;
	}
}

module.exports = newThrow;