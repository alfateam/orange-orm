var Promise = require('promise');
var objectToCallback = require('./objectToCallback');

function newPromise(func) {
	if (!func)
		return objectToCallback();
	return new Promise(func);
}

newPromise.all = Promise.all;
//handle empty
module.exports = newPromise;