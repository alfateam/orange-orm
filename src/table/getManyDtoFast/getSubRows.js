var newSingleQuery = require('./query/newSingleQuery');
var extractOrderBy = require('../../table/query/extractOrderBy');
var newShallowJoinSql = require('../query/singleQuery/joinSql/newShallowJoinSql');
const executeQueries = require('../executeQueries');

async function getSubRows(parentRows, filter, span, alias, innerJoin, orderBy) {
	var promises = [];
	var c = {};

	c.visitOne = function(leg) {
		const rightAlias = alias;
		var nextAlias = rightAlias + '_0';
		var parentTable = leg.table;
		var childColumns = parentTable._primaryColumns;
		var parentColumns = leg.columns;
		var shallowJoin = newShallowJoinSql(parentTable, parentColumns, childColumns, nextAlias, rightAlias);
		var nextOrderBy = orderBy + ',' + extractOrderBy(leg.span.table, nextAlias, leg.span.orderBy).substring(9);
		var nextInnerJoin = shallowJoin + innerJoin;
		var query = newSingleQuery(leg.span.table, filter, leg.span, nextAlias, nextInnerJoin, nextOrderBy);

		promises.push(executeQueries([query])
			.then(res => res[0])
			.then(async (rows) => {
				importOne(rows, leg);
				await getSubRows(rows, filter, leg.span, alias + '_0', nextOrderBy);
			}));
	};

	c.visitMany = function(leg) {
		const rightAlias = alias;
		var nextAlias = rightAlias + '_0';
		var parentTable = leg.table;
		var childColumns = parentTable._primaryColumns;
		var parentColumns = leg.columns;
		var shallowJoin = newShallowJoinSql(parentTable, parentColumns, childColumns, nextAlias, rightAlias);
		var nextOrderBy = orderBy + ',' + extractOrderBy(leg.span.table, nextAlias, leg.span.orderBy).substring(9);
		var nextInnerJoin = shallowJoin + innerJoin;
		var query = newSingleQuery(leg.span.table, filter, leg.span, nextAlias, nextInnerJoin, nextOrderBy);

		promises.push(executeQueries([query])
			.then(res => res[0])
			.then(async (rows) => {
				importMany(rows, leg);
				await getSubRows(rows, filter, leg.span, alias + '_0', nextInnerJoin, nextOrderBy);
			}));
	};

	c.visitJoin = function(leg) {
		var nextAlias = alias + '_0';
		var span = leg.span;
		var parentTable = leg.table;
		var childColumns = span.table._primaryColumns;
		var parentColumns = leg.columns;
		var shallowJoin = newShallowJoinSql(parentTable, childColumns, parentColumns, nextAlias, alias);
		var nextOrderBy = orderBy + ',' + extractOrderBy(leg.span.table, nextAlias, leg.span.orderBy).substring(9);
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
		importOneObjects(rows, prop, parentColumns, childColumns);
	}

	function importMany(rows, leg) {
		const prop = leg.name;
		var parentColumns = leg.table._primaryColumns;
		var childColumns = leg.columns;
		let j = 0;
		for (let i = 0; i < parentRows.length; i++) {
			const array = [rows[j]];
			while (j+1 < rows.length && isChild(parentRows[i], rows[j+1], parentColumns, childColumns)) {
				j++;
				array.push(rows[j]);
			}
			parentRows[i][prop] = array;
			j++;
			if (j >= rows.length)
				return;
		}

	}

	function importJoined(rows, leg) {
		const prop = leg.name;
		var parentColumns = leg.columns;
		var childColumns = leg.span.table._primaryColumns;
		for (let i = 0; i < parentRows.length; i++) {
			if (isChild(parentRows[i], rows[i], parentColumns, childColumns))
				parentRows[i][prop] = rows[i];
			else
				parentRows[i][prop] = null;
		}
	}

	function importOneObjects(rows, prop, parentColumns, childColumns) {
		for (let i = 0; i < parentRows.length; i++) {
			if (isChild(parentRows[i], rows[i], parentColumns, childColumns))
				parentRows[i][prop] = rows[i];
			else
				parentRows[i][prop] = null;
		}
	}


	// function importArrays(rows, prop, parentColumns, childColumns) {
	// 	let j = 0;
	// 	for (let i = 0; i < parentRows.length; i++) {
	// 		const array = [rows[j]];
	// 		while (isChild)

	// 		// parentRows[i][prop] = [];
	// 		// if (isChild(parentRows[i], rows[j], parentColumns, childColumns)) {
	// 		// 	parentRows[i][prop] = rows[j];
	// 		// 	j++;
	// 		// 	if (j == parentRows.length)
	// 		// 		return;
	// 		// 	while (isChild(parentRows[i], rows[j], parentColumns, childColumns)) {
	// 		// 		if (j == parentRows.length)
	// 		// 			return;
	// 		// 		parentRows[i][prop] = rows[j];
	// 		// 		j++;
	// 		// 	}
	// 		// }
	// 	}
	// let j = 0;
	// for (let i = 0; i < rows.length; i++) {
	// 	const row = rows[i];
	// 	while (j < parentRows.length && !isChild(parentRows[j], row, parentColumns, childColumns)) {
	// 		if (!parentRows[j][prop])
	// 			parentRows[j][prop] = [];
	// 		j++;
	// 	}
	// 	if (j < parentRows.length)
	// 		if (parentRows[j][prop])
	// 			parentRows[j][prop].push(row);
	// 		else
	// 			parentRows[j][prop] = [row];
	// 	else
	// 		return;

	// }
	// }


	function isChild(parentRow, row, parentColumns, childColumns) {
		for (let i = 0; i < childColumns.length; i++) {
			if (row[childColumns[i].alias] == parentRow[parentColumns[i].alias])
				continue;
			return false;
		}
		return true;
	}

}

module.exports = getSubRows;