var Promise = require('promise');
var objectToCallback = require('./objectToCallback');
var commit = commitFirstTime;
var rollback = rollbackFirstTime;
var oldDone = Promise.prototype.done;

Promise.prototype.done = function (onFulfilled, onRejected) {
	var self = this.then(commit);
	var rollbacked = self.then(null, rollback);
	var rollbackFailed = rollbacked.then(null, onRollbackFailed);

	function onRollbackFailed(err) {
		//
		throw err;
	}

	oldDone.apply(rollbackFailed, arguments);
};

function commitFirstTime() {
	commit = require('./commit');
	return commit();
}

function rollbackFirstTime() {
	rollback = require('./rollback')
	return rollback();
}

function newPromise(func) {
	if (!func)
		return new Promise(objectToCallback());
	return new Promise(func);
}

newPromise.all = Promise.all;
module.exports = newPromise;