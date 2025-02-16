const negotiateRawSqlFilter = require('../column/negotiateRawSqlFilter');
let subFilter = require('./subFilter');
let isShallow = true;

function newNone(newRelatedTable, relations, depth) {

	function none(context, fn) {
		let relatedTable = newRelatedTable(relations, isShallow, depth + 1);
		let arg = typeof fn === 'function' ? fn(relatedTable) : fn;
		let filter = negotiateRawSqlFilter(context, arg);
		return subFilter(context, relations, filter, depth).not();
	}
	return none;
}

module.exports = newNone;