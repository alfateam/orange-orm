var Promise = require('promise');

function newPromise(func) {
	return new Promise(func);
}

newPromise.all = Promise.all;
//newPromise.serial = Promise.serial;

module.exports = newPromise;