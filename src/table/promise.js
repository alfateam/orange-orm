function newPromise(func) {
	if (!func)
		return Promise.resolve.apply(Promise, arguments);
	return new Promise(func);
}

newPromise.all = Promise.all;
module.exports = newPromise;