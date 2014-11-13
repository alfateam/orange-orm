var promise = require('promise');
var objectToCallback = require('./objectToCallback');

function newPromise(func) {
	if (!func)
		return new promise(objectToCallback());
	return new promise(func);
}

newPromise.all = promise.all;
module.exports = newPromise;