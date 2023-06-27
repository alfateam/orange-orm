const newQuery = require('./getManyDtoFast/newQuery');
const getSubRows = require('./getManyDtoFast/getSubRows.js');
const negotiateRawSqlFilter = require('../table/column/negotiateRawSqlFilter');
const strategyToSpan = require('../table/strategyToSpan');
const executeQueries = require('../table/executeQueries');
const extractOrderBy = require('../table/query/extractOrderBy');
const emptyInnerJoin = '';

let emptyFilter = require('../emptyFilter');

async function getManyDtoFast(table, filter, strategy) {
	filter = negotiateRawSqlFilter(filter, table);
	let span = strategyToSpan(table, strategy);
	let alias = table._dbName;

	const query = newQuery(table, filter, span, alias);
	const res = await executeQueries([query]);
	const rows = await res[0];
	const idFilter = createIdFilter(table, rows);
	const orderBy = extractOrderBy(table, alias, span.orderBy);
	await getSubRows(rows, idFilter, span, alias, emptyInnerJoin, orderBy);
	return rows;
}

function createIdFilter(table, rows) {
	if (table._primaryColumns.length === 1)
		return createInFilter();
	else
		return createCompositeFilter();

	function createInFilter() {
		let alias = table._primaryColumns[0].alias;
		let ids = [];
		for (let i = 0; i < rows.length; i++) {
			ids.push(rows[i][alias]);
		}
		return table._primaryColumns[0].in(ids);
	}

	function createCompositeFilter() {
		let filter = emptyFilter;
		for (let i = 0; i < rows.length; i++) {
			filter = filter.or(primaryFilter(rows[i]));
		}
		return filter;
	}

	function primaryFilter(row) {
		let filter = emptyFilter;
		for (var i = 1; i < table._primaryColumns.length; i++) {
			const column = table._primaryColumns[i];
			filter = filter.and(column.eq(row[column.alias]));
		}
		return filter;
	}
}

module.exports = getManyDtoFast;