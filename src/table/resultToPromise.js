
var deferred = require('deferred');

function resultToPromise(result) {
	return deferred.resolve(result);
}

module.exports = resultToPromise;