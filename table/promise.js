var promise = require('promise/domains');
let promisify = require('util').promisify;


function newPromise(func) {
	if (!func)
		return Promise.resolve();
	return new promise(func);
}

newPromise.all = Promise.all;
newPromise.denodeify = promisify || promise.denodeify;
module.exports = newPromise;