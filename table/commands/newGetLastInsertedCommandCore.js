let newParameterized = require('../query/newParameterized');
let getSessionContext = require('../getSessionContext')
let util = require('util');

function newGetLastInsertedCommandCore(table, row) {
	return newParameterized(getSql(table, row));
}

function getSql(table, row) {
	return `SELECT ${columnNames()} FROM ${table._dbName} WHERE ${whereSql()}`

	function columnNames() {
		return table._columns.map(col => col._dbName).join(',');
	}

	function whereSql() {
		return [discriminators(), getSessionContext().lastInsertedSql()].filter(x => x).join(',');
	}

	function discriminators() {
		return table._columnDiscriminators.join(',');		
	}
}

module.exports = newGetLastInsertedCommandCore;