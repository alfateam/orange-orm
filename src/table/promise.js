var promise = require('promise/domains');
var deferred = require('deferred');
let promisify = require('util').promisify;


function newPromise(func) {
	if (!func)
		return Promise.resolve.apply(Promise, arguments);
	// return deferred.resolve.apply(deferred, arguments);
	return new Promise(func);
}

newPromise.all = Promise.all;
newPromise.denodeify = promisify || promise.denodeify;
module.exports = newPromise;