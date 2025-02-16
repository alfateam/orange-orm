const negotiateRawSqlFilter = require('../column/negotiateRawSqlFilter');
let subFilter = require('./subFilter');
let isShallow = true;

function newAll(newRelatedTable, relations, depth) {

	function all(context, fn) {
		let relatedTable = newRelatedTable(relations, isShallow, depth + 1);
		let arg = typeof fn === 'function' ? fn(relatedTable) : fn;
		let anyFilter = negotiateRawSqlFilter(context, arg);
		let anySubFilter = subFilter(context, relations, anyFilter, depth);
		let notFilter = subFilter(context, relations, anyFilter.not(), depth).not();
		return anySubFilter.and(context, notFilter);
	}
	return all;
}

module.exports = newAll;