let newRelatedTable = _newRelatedTable;
const negotiateRawSqlFilter = require('../column/negotiateRawSqlFilter');
let subFilter = require('./subFilter');
let isShallow = true;

function newAll(relations) {

	function all(fn) {
		let relatedTable = newRelatedTable(relations, isShallow);
		let anyFilter = negotiateRawSqlFilter(fn(relatedTable));
		let anySubFilter = subFilter(relations, anyFilter);
		let notFilter = subFilter(relations, anyFilter.not()).not();
		return anySubFilter.and(notFilter);
	}
	return all;
}

function _newRelatedTable() {
	newRelatedTable = require('../newRelatedTable');
	return newRelatedTable.apply(null, arguments);
}

module.exports = newAll;