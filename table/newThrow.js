
function newThrow(e, previousPromise) {
	return previousPromise.then(throwError, throwError);
	function throwError() {
		throw e;
	}
};

module.exports = newThrow;