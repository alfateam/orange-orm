let newRelatedTable = _newRelatedTable;
const negotiateRawSqlFilter = require('../column/negotiateRawSqlFilter');
let subFilter = require('./subFilter');
let isShallow = true;

function newAll(relations, depth) {

	function all(fn) {
		let relatedTable = newRelatedTable(relations.slice(-1), isShallow, depth + 1);
		let arg = typeof fn === 'function' ? fn(relatedTable) : fn;
		let anyFilter = negotiateRawSqlFilter(arg);
		let anySubFilter = subFilter(relations.slice(-1), anyFilter, depth); 
		let notFilter = subFilter(relations.slice(-1), anyFilter.not(), depth).not();
		return anySubFilter.and(notFilter);
	}
	return all;
}

function _newRelatedTable() {
	newRelatedTable = require('../newRelatedTable');
	return newRelatedTable.apply(null, arguments);
}

module.exports = newAll;