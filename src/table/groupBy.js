const newQuery = require('./groupBy/newQuery');
const negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');
const strategyToSpan = require('./strategyToSpan');
const executeQueries = require('./executeQueries');

async function groupBy(context, table, filter, strategy) {
	filter = negotiateRawSqlFilter(context, filter, table);
	if (strategy && strategy.where) {
		let arg = typeof strategy.where === 'function' ? strategy.where(table) : strategy.where;
		filter = filter.and(context, arg);
	}

	let span = strategyToSpan(table, strategy);
	span.columns = new Map();

	let alias = table._dbName;

	const query = newQuery(context, table, filter, span, alias);
	const res = await executeQueries(context, [query]);
	return decode(context, span, await res[0]);
}

function newCreateRow(span) {
	const protoRow = createProto(span);

	return createRow;

	function createRow() {
		return Object.create(protoRow);
	}
}

function createProto(span) {
	let obj = {};
	for (let key in span.aggregates) {
		obj[key] = null;
	}

	return obj;
}


async function decode(context, span, rows, keys = rows.length > 0 ? Object.keys(rows[0]) : []) {
	const rowsLength = rows.length;
	const aggregateKeys = Object.keys(span.aggregates);

	const outRows = new Array(rowsLength);
	const createRow = newCreateRow(span);
	for (let i = 0; i < rowsLength; i++) {
		const row = rows[i];
		let outRow = createRow();

		for (let j = 0; j < aggregateKeys.length; j++) {
			const key = aggregateKeys[j];
			const parse = span.aggregates[key].column?.decode || ((_context, arg) => Number.parseFloat(arg));
			outRow[key] =  parse(context, row[keys[j]]);
		}

		outRows[i] = outRow;
	}

	return outRows;
}

module.exports = groupBy;