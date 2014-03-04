var Promise = require('promise');

function newPromise(func) {
	return new Promise(func);
}

newPromise.all = Promise.all;

module.exports = newPromise;