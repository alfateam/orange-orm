var promise = require('promise/domains');
var deferred = require('deferred');
var objectToCallback = require('./objectToCallback');

function newPromise(func) {
	if (!func)
		return deferred.resolve();
	return new promise(func);
}

newPromise.all = promise.all;
newPromise.denodeify = promise.denodeify;
module.exports = newPromise;