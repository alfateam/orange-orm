var tryReleaseDbClient = require('./tryReleaseDbClient');

function newThrow(context, e, previousPromise) {
	return previousPromise.then(throwError, throwError);
	function throwError() {
		tryReleaseDbClient(context);
		throw e;
	}
}

module.exports = newThrow;