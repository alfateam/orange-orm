var commit = require('./table/commit');
var rollback = require('./table/rollback');

function resolveCommitAndRollback(success) {
	success(commit, rollback);
};

module.exports = resolveCommitAndRollback;