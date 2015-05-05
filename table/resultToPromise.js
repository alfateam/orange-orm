// var objectToCallback = require('./objectToCallback');
// var newPromise = require('./promise');

var deferred = require('deferred');

function resultToPromise(result) {
	return deferred.resolve(result);
	// var callback = objectToCallback(result);
	// return newPromise(callback);
}

module.exports = resultToPromise;