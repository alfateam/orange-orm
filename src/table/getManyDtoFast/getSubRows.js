var newSingleQuery = require('./query/newSingleQuery');
var extractFilter = require('../../table/query/extractFilter');
var extractOrderBy = require('../../table/query/extractOrderBy');
var newShallowJoinSql = require('../query/singleQuery/joinSql/newShallowJoinSql');
const executeQueries = require('../executeQueries');

async function getSubRows(parentRows, filter, span, alias, innerJoin, orderBy) {
	var promises = [];
	var c = {};

	c.visitOne = function (leg) {
		const rightAlias = alias;
		var nextAlias = rightAlias + '_0';
		var parentTable = leg.table;
		var childColumns = parentTable._primaryColumns;
		var parentColumns = leg.columns;
		var shallowJoin = newShallowJoinSql(parentTable, parentColumns, childColumns, nextAlias, rightAlias);
		var nextOrderBy = orderBy + ',' + extractOrderBy(parentTable, nextAlias, span.orderBy).substring(9);
		var nextInnerJoin = shallowJoin + innerJoin;
		var query = newSingleQuery(leg.span.table, filter, leg.span, nextAlias, nextInnerJoin, nextOrderBy);

		promises.push(executeQueries([query])
			.then(res => res[0])
			.then(async (rows) => {
				importOne(rows, leg)
				await getSubRows(rows, filter, leg.span, alias + '_0', nextOrderBy);
		}));
	};

	function createManyOrOneQuery(leg) {
		const rightAlias = alias;
		var nextAlias = rightAlias + '_0';
		var parentTable = leg.table;
		var childColumns = parentTable._primaryColumns;
		var parentColumns = leg.columns;
		var shallowJoin = newShallowJoinSql(parentTable, parentColumns, childColumns, nextAlias, rightAlias);
		var nextOrderBy = orderBy + ',' + extractOrderBy(parentTable, nextAlias, span.orderBy).substring(9);
		var nextInnerJoin = shallowJoin + innerJoin;
		return newSingleQuery(leg.span.table, filter, leg.span, nextAlias, nextInnerJoin, nextOrderBy);
	}

	c.visitMany = function (leg) {
		const rightAlias = alias;
		var nextAlias = rightAlias + '_0';
		var parentTable = leg.table;
		var childColumns = parentTable._primaryColumns;
		var parentColumns = leg.columns;
		var shallowJoin = newShallowJoinSql(parentTable, parentColumns, childColumns, nextAlias, rightAlias);
		var nextOrderBy = orderBy + ',' + extractOrderBy(parentTable, nextAlias, span.orderBy).substring(9);
		var nextInnerJoin = shallowJoin + innerJoin;
		// var nextInnerJoin = shallowJoin + innerJoin;

		var query = newSingleQuery(leg.span.table, filter, leg.span, nextAlias, nextInnerJoin, nextOrderBy);

		promises.push(executeQueries([query])
			.then(res => res[0])
			.then(async (rows) => {
				importMany(rows, leg);
				await getSubRows(rows, filter, leg.span, alias + '_0', nextInnerJoin, nextOrderBy);
			}));
	};

	c.visitJoin = function (leg) {
		var nextAlias = alias + '_0';
		var span = leg.span;
		var parentTable = leg.table;
		var childColumns = span.table._primaryColumns;
		var parentColumns = leg.columns;
		var shallowJoin = newShallowJoinSql(parentTable, childColumns, parentColumns, nextAlias, alias);
		var nextOrderBy = orderBy + ',' + extractOrderBy(parentTable, nextAlias, span.orderBy).substring(9);
		var nextInnerJoin = shallowJoin + innerJoin;
		var query = newSingleQuery(span.table, filter, span, nextAlias, nextInnerJoin, nextOrderBy);
		promises.push(executeQueries([query])
			.then(res => res[0])
			.then(async (rows) => { 
				importJoined(rows, leg);
				await getSubRows(rows, filter, leg.span, alias + '_0', nextInnerJoin, nextOrderBy);
		}));
	};

	const legs = span.legs.toArray();
	for (let i = 0; i < legs.length; i++) {
		legs[i].accept(c);
		await Promise.all(promises);
	}

	function importOne(rows, leg) {
		const prop = leg.name;
		var parentColumns = leg.table._primaryColumns;
		var childColumns = leg.columns;
		importObjects(rows, prop, parentColumns, childColumns);
	}

	function importMany(rows, leg) {
		const prop = leg.name;
		var parentColumns = leg.table._primaryColumns;
		var childColumns = leg.columns;
		importArrays(rows, prop, parentColumns, childColumns);
	}

	function importJoined(rows, leg) {
		const prop = leg.name;
		var parentColumns = leg.columns;
		var childColumns = leg.span.table._primaryColumns;
		importObjects(rows, prop, parentColumns, childColumns);
	}

	function importObjects(rows, prop, parentColumns, childColumns) {
		for (let i = 0; i < parentRows.length; i++) {
			parentRows[i][prop] = null;
			for (let j = 0; j < rows.length; j++) {
				const row = rows[j];
				while (isNotChild(parentRows[i], row, parentColumns, childColumns)) {
					i++;
					parentRows[i][prop] = null;
				}
				parentRows[i][prop] = row;
			}
		}
	}

	function importArrays(rows, prop, parentColumns, childColumns) {
		for (let i = 0; i < parentRows.length; i++) {
			parentRows[i][prop] = [];
			for (let j = 0; j < rows.length; j++) {
				const row = rows[j];
				while (isNotChild(parentRows[i], row, parentColumns, childColumns)) {
					i++;
					parentRows[i][prop] = [];
				}
				parentRows[i][prop].push(row);
			}
		}

	}

	function isNotChild(parentRow, row, parentColumns, childColumns) {
		for (let i = 0; i < childColumns.length; i++) {
			if (row[childColumns[i].alias] !== parentRow[parentColumns[i].alias])
				return true;
		}
	}

}

module.exports = getSubRows;