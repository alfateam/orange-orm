var Promise = require('promise');
var objectToCallback = require('./objectToCallback');
var commit = commitFirstTime;
var rollback = rollbackFirstTime;
var oldDone = Promise.prototype.done;

/*Promise.prototype.done = function (onFulfilled, onRejected) {
	var error;
	var negotiateRollback = function() {
		if (error) 
			return rollback();
	};

	var self = this.then(commit).then(null,saveError).then(negotiateRollback).then(negotiateThrow);

	function saveError(e) {
		error = e;
	}

	function negotiateThrow() {
		if (error)
			throw error;
	}

	oldDone.apply(self, arguments);
};
*/
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