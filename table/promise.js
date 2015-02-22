var promise = require('promise');
var objectToCallback = require('./objectToCallback');

function newPromise(func) {
	if (!func)
		return new promise(objectToCallback());
	return new promise(func);
}

newPromise.all = promise.all;
newPromise.denodeify = promise.denodeify;
module.exports = newPromise;