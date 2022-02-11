let newRelatedTable = _newRelatedTable;
const negotiateRawSqlFilter = require('../column/negotiateRawSqlFilter');
let subFilter = require('./subFilter');
let isShallow = true;

function newAny(relations) {

	function any(fn) {
		let relatedTable = newRelatedTable(relations, isShallow);
		let arg = typeof fn === 'function' ? fn(relatedTable) : fn;
		let filter = negotiateRawSqlFilter(arg);
		return subFilter(relations, filter);
	}
	return any;
}

function _newRelatedTable() {
	newRelatedTable = require('../newRelatedTable');
	return newRelatedTable.apply(null, arguments);
}

module.exports = newAny;