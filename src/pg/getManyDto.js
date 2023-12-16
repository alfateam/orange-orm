const newQuery = require('./getManyDto/newQuery');
const negotiateRawSqlFilter = require('../table/column/negotiateRawSqlFilter');
const strategyToSpan = require('../table/strategyToSpan');
const executeQueries = require('../table/executeQueries');
const newPrimaryKeyFilter = require('../table/newPrimaryKeyFilter');
const newForeignKeyFilter = require('../table/relation/newForeignKeyFilter');
// const getSubRows = require('../table/getManyDtoFast/getSubRows');

// const getSubRows = require('../table/getManyDtoFast/getSubRows');

async function getManyDto(table, filter, strategy) {
	filter = negotiateRawSqlFilter(filter, table);
	let span = strategyToSpan(table, strategy);
	let alias = table._dbName;

	const query = newQuery(table, filter, span, alias);
	const res = await executeQueries([query]);
	const { rows, rowsMap, ids } = decode(table, span, await res[0]);
	await getSubRows(table, strategy, rows, rowsMap, ids);
	return rows;

}

function decode(table, span, rows) {
	let columnsMap = span.columns;
	const columns = table._columns.filter(column => !columnsMap || columnsMap.get(column));
	const rowsLength = rows.length;
	const columnsLength = columns.length;
	const primaryColumns = table._primaryColumns;
	const rowsMap = {};
	const fkIds = new Array(rows.length);
	const getIds = createGetIds();

	for (let i = 0; i < rowsLength; i++) {
		const row = rows[i];
		for (let j = 0; j < columnsLength; j++) {
			const column = columns[j];
			row[column.alias] = column.decode(row[column.alias]);
			fkIds[i] = getIds(row);
		}
		addToMap(rowsMap, primaryColumns, row);
	}
	return { rows, rowsMap, ids: fkIds };

	function addToMap(map, primaryColumns, row) {
		const lastIndex = primaryColumns.length - 1;
		for (let i = 0; i < lastIndex; i++) {
			map = map[primaryColumns[i].alias] || {};
		}
		map[primaryColumns[lastIndex]] = row;
	}

	function createGetIds() {
		const primaryColumns = table._primaryColumns;
		const length = primaryColumns.length;
		if (length > 1) {
			const alias = table._primaryColumns[0].alias;
			return (row) => row[alias];
		}
		else
			return (row) => {
				const result = new Array(length);
				for (let i = 0; i < length; i++) {
					result[i] = row[primaryColumns[i].alias];
				}
				return result;
			};
	}

}

async function getSubRows(table, strategy, parentRows, parentRowsMap, ids) {
	console.dir('getsubrows');
	const result = {};
	const span = strategyToSpan(table, strategy);

	const c = {};

	c.visitJoin = async function(leg) {
		const name = leg.name;
		const relation = table._relations[name];
		const filter = createJoinFilter(relation, ids, table);
		const subRows = await getManyDto(relation.childTable, filter, strategy[name]);
		console.dir(name);
		console.dir(subRows.length);
		for (let i = 0; i < subRows.length; i++) {
			// parentRowsMap = subRows[i];
		}


	};
	c.visitOne = async function(leg) {
		const name = leg.name;
		const relation = table._relations[name];
		const filter = createOneFilter(relation, ids, parentRows, table);
		const subRows = await getManyDto(relation.childTable, filter, strategy[name]);
		console.dir(name);
		console.dir(subRows.length);

	};
	c.visitMany = c.visitOne;

	span.legs.forEach(onEachLeg);

	function onEachLeg(leg) {
		leg.accept(c);
	}

	return result;

}


function createOneFilter(relation, ids, parentRows, table) {
	let parentTable = relation.joinRelation.childTable;

	if (parentTable._primaryColumns.length === 1)
		return relation.joinRelation.columns[0].in(ids);

	else
		return createCompositeFilter();

	function createCompositeFilter() {
		var filter = newPrimaryKeyFilter.apply(null, parentRows[0]);

		for (var i = 1; i < ids.length; i++) {
			const args = [table].concat(parentRows[i]);
			filter = filter.or(newForeignKeyFilter.apply(null, args));
		}
		return filter;
	}
}

function createJoinFilter(relation, ids, table) {
	if (relation.columns.length === 1)
		return relation.childTable._primaryColumns[0].in(ids);

	else
		return createCompositeFilter();

	function createCompositeFilter() {
		const args = [table].concat(ids[0]);
		var filter = newPrimaryKeyFilter.apply(null, args);

		for (var i = 1; i < ids.length; i++) {
			const args = [table].concat(ids[i]);
			filter = filter.or(newPrimaryKeyFilter.apply(null, args));
		}
		return filter;
	}
}

function createSubFilters(parentRows, ids, table, span) {
	var result = {};
	var c = {};

	c.visitJoin = function(leg) {
		const name = leg.name;
		const relation = table._relations[name];
		if (relation.columns.length === 1)
			result[name] = relation.childTable._primaryColumns[0].in(ids);
		else
			result[name] = createCompositeFilter();

		function createCompositeFilter() {
			const args = [table].concat(ids[0]);
			var filter = newPrimaryKeyFilter.apply(null, args);

			for (var i = 1; i < ids.length; i++) {
				const args = [table].concat(ids[i]);
				filter = filter.or(newPrimaryKeyFilter.apply(null, args));
			}
			return filter;
		}

	};
	c.visitOne = function(leg) {
		const name = leg.name;
		const relation = table._relations[name];

		let parentTable = relation.joinRelation.childTable;

		if (parentTable._primaryColumns.length === 1)
			result[name] = relation.joinRelation.columns[0].in(ids);
		else
			result[name] = createCompositeFilter();

		function createCompositeFilter() {
			var filter = newPrimaryKeyFilter.apply(null, parentRows[0]);

			for (var i = 1; i < ids.length; i++) {
				const args = [table].concat(parentRows[i]);
				filter = filter.or(newForeignKeyFilter.apply(null, args));
			}
			return filter;
		}

	};
	c.visitMany = c.visitOne;

	span.legs.forEach(onEachLeg);

	function onEachLeg(leg) {
		leg.accept(c);
	}

	return result;

}




module.exports = getManyDto;