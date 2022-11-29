let newRelatedTable = _newRelatedTable;
const negotiateRawSqlFilter = require('../column/negotiateRawSqlFilter');
let subFilter = require('./subFilter');
let isShallow = true;

function newNone(relations) {

	function none(fn) {
		let relatedTable = newRelatedTable(relations, isShallow);
		let arg = typeof fn === 'function' ? fn(relatedTable) : fn;
		let filter = negotiateRawSqlFilter(arg);
		return subFilter(relations, filter).not();
	}
	return none;
}

function _newRelatedTable() {
	newRelatedTable = require('../newRelatedTable');
	return newRelatedTable.apply(null, arguments);
}

module.exports = newNone;