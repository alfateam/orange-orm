var Promise = require('promise');
var objectToCallback = require('./objectToCallback');

function newPromise(func) {
	if (!func)
		return new Promise(objectToCallback());
	return new Promise(func);
}

newPromise.all = Promise.all;
module.exports = newPromise;