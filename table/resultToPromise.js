var objectToCallback = require('./objectToCallback');
var newPromise = require('./promise');

function resultToPromise(result) {
	var callback = objectToCallback(result);
	return newPromise(callback);
}

module.exports = resultToPromise;