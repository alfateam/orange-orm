const emptyFilter = require('./emptyFilter');
const newQuery = require('./getManyDto/newQuery');
const negotiateRawSqlFilter = require('./table/column/negotiateRawSqlFilter');
const strategyToSpan = require('./table/strategyToSpan');
const executeQueries = require('./table/executeQueries');

async function getManyDto(table, filter, strategy, spanFromParent) {
	filter = negotiateRawSqlFilter(filter, table);
	if (strategy && strategy.where) {
		let arg = typeof strategy.where === 'function' ? strategy.where(table) : strategy.where;
		filter = filter.and(arg);
	}

	let span = spanFromParent || strategyToSpan(table, strategy);
	let alias = table._dbName;

	const query = newQuery(table, filter, span, alias);
	const res = await executeQueries([query]);
	return decode(strategy, span, await res[0]);
}

function newCreateRow(span) {
	let columnsMap = span.columns;
	const columns = span.table._columns.filter(column => !columnsMap || columnsMap.get(column));
	const protoRow = createProto(columns, span);
	const manyNames = [];

	const c = {};
	c.visitJoin = () => { };
	c.visitOne = () => { };
	c.visitMany = function(leg) {
		manyNames.push(leg.name);
	};

	span.legs.forEach(onEachLeg);
	return createRow;

	function onEachLeg(leg) {
		leg.accept(c);
	}

	function createRow() {
		const obj = Object.create(protoRow);
		for (let i = 0; i < manyNames.length; i++) {
			obj[manyNames[i]] = [];
		}
		return obj;
	}
}

function createProto(columns, span) {
	let obj = {};
	for (let i = 0; i < columns.length; i++) {
		obj[columns[i].alias] = null;
	}
	for (let key in span.aggregates) {
		obj[key] = null;
	}
	const c = {};

	c.visitJoin = function(leg) {
		obj[leg.name] = null;
	};
	c.visitOne = c.visitJoin;
	c.visitMany = function(leg) {
		obj[leg.name] = null;
	};

	span.legs.forEach(onEachLeg);

	function onEachLeg(leg) {
		leg.accept(c);
	}

	return obj;
}

function hasManyRelations(span) {
	let result;
	const c = {};
	c.visitJoin = () => { };
	c.visitOne = c.visitJoin;
	c.visitMany = function() {
		result = true;
	};

	span.legs.forEach(onEachLeg);
	return result;

	function onEachLeg(leg) {
		leg.accept(c);
	}
}

async function decode(strategy, span, rows, keys = rows.length > 0 ? Object.keys(rows[0]) : []) {
	const table = span.table;
	let columnsMap = span.columns;
	const columns = table._columns.filter(column => !columnsMap || columnsMap.get(column));
	const rowsLength = rows.length;
	const columnsLength = columns.length;
	const primaryColumns = table._primaryColumns;
	const primaryColumnsLength = primaryColumns.length;
	const rowsMap = new Map();
	const fkIds = new Array(rows.length);
	const getIds = createGetIds();
	const aggregateKeys = Object.keys(span.aggregates);

	const outRows = new Array(rowsLength);
	const createRow = newCreateRow(span);
	const shouldCreateMap = hasManyRelations(span);
	for (let i = 0; i < rowsLength; i++) {
		const row = rows[i];
		let outRow = createRow();
		let pkWithNullCount = 0;
		for (let j = 0; j < columnsLength; j++) {
			if (j < primaryColumnsLength) {
				if (row[keys[j]] === null)
					pkWithNullCount++;
				if (pkWithNullCount === primaryColumnsLength) {
					outRow = null;
					break;
				}
			}
			const column = columns[j];
			outRow[column.alias] = column.decode(row[keys[j]]);
		}

		for (let j = 0; j < aggregateKeys.length; j++) {
			const key = aggregateKeys[j];
			const parse = span.aggregates[key].column?.decode || Number.parseFloat;
			outRow[key] =  parse(row[keys[j+columnsLength]]);
		}

		outRows[i] = outRow;
		if (shouldCreateMap) {
			fkIds[i] = getIds(outRow);
			addToMap(rowsMap, primaryColumns, outRow);
		}
	}
	span._rowsMap = rowsMap;
	span._ids = fkIds;

	keys.splice(0, columnsLength + aggregateKeys.length);

	await decodeRelations(strategy, span, rows, outRows, keys);
	return outRows;


	function createGetIds() {
		const primaryColumns = table._primaryColumns;
		const length = primaryColumns.length;
		if (length === 1) {
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

async function decodeRelations(strategy, span, rawRows, resultRows, keys) {
	const promises = [];
	const c = {};
	c.visitJoin = function(leg) {
		const name = leg.name;
		const p = decode(strategy[name], leg.span, rawRows, keys).then((rows) => {
			for (let i = 0; i < rows.length; i++) {
				resultRows[i][name] = rows[i];
			}
		});
		promises.push(p);
	};

	c.visitOne = c.visitJoin;

	c.visitMany = function(leg) {
		const name = leg.name;
		const table = span.table;
		const relation = table._relations[name];
		const filter = createOneFilter(relation, span._ids);
		const rowsMap = span._rowsMap;
		const p = getManyDto(relation.childTable, filter, strategy[name], leg.span).then(subRows => {
			for (let i = 0; i < subRows.length; i++) {
				const key = leg.columns.map(column => subRows[i][column.alias]);
				const parentRow = getFromMap(rowsMap, table._primaryColumns, key);
				parentRow[name].push(subRows[i]);
			}
		});
		promises.push(p);
	};

	span.legs.forEach(onEachLeg);

	function onEachLeg(leg) {
		leg.accept(c);
	}

	await Promise.all(promises);
}

function createOneFilter(relation, ids) {
	const columns = relation.joinRelation.columns;

	if (columns.length === 1)
		return columns[0].in(ids);

	else
		return createCompositeFilter();

	function createCompositeFilter() {
		let filter = emptyFilter;
		for(let id of ids) {
			let nextFilter;
			for (let i = 0; i < columns.length; i++) {
				if (nextFilter)
					nextFilter = nextFilter.and(columns[i].eq(id[i]));
				else
					nextFilter = columns[i].eq(id[i]);
			}
			filter = filter.or(nextFilter);
		}
		return filter;
	}
}

function addToMap(map, primaryColumns, row) {

	const lastIndex = primaryColumns.length - 1;
	for (let i = 0; i < lastIndex; i++) {
		const id = row[primaryColumns[i].alias];
		if (map.has(id))
			map = map.get(id);
		else {
			const next = new Map();
			map.set(id, next);
			map = next;
		}
	}
	map.set(row[primaryColumns[lastIndex].alias], row);
}

function getFromMap(map, primaryColumns, values) {
	const length = primaryColumns.length;
	for (let i = 0; i < length; i++) {
		map = map.get(values[i]);
	}
	return map;
}


module.exports = getManyDto;