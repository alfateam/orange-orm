const emptyFilter = require('./emptyFilter');
const newQuery = require('./getManyDto/newQuery');
const negotiateRawSqlFilter = require('./table/column/negotiateRawSqlFilter');
const strategyToSpan = require('./table/strategyToSpan');
const executeQueries = require('./table/executeQueries');
const getSessionSingleton = require('./table/getSessionSingleton');

async function getManyDto(context, table, filter, strategy, spanFromParent, updateParent) {
	filter = negotiateRawSqlFilter(context, filter, table);
	if (strategy && strategy.where) {
		let arg = typeof strategy.where === 'function' ? strategy.where(context, table) : strategy.where;
		filter = filter.and(context, arg);
	}

	let span = spanFromParent || strategyToSpan(table, strategy);
	if (!spanFromParent)
		assignAliases(span, table._dbName);
	let alias = table._dbName;

	const query = newQuery(context, table, filter, span, alias);
	const res = await executeQueries(context, [query]);
	return decode(context, strategy, span, await res[0], undefined, updateParent);
}

function assignAliases(span, alias) {
	span._alias = alias;
	span.legs.forEach((leg) => {
		assignAliases(leg.span, alias + leg.name);
	});
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

async function decode(context, strategy, span, rows, keys = rows.length > 0 ? Object.keys(rows[0]) : [], updateParent) {
	const table = span.table;
	let columnsMap = span.columns;
	const selectedColumns = [];
	for (let i = 0; i < table._columns.length; i++) {
		const column = table._columns[i];
		if (!columnsMap || columnsMap.get(column))
			selectedColumns.push({ column, index: i });
	}
	const rowsLength = rows.length;
	const columnsLength = selectedColumns.length;
	const primaryColumns = table._primaryColumns;
	const primaryColumnsLength = primaryColumns.length;
	const rowsMap = new Map();
	const fkIds = new Array(rows.length);
	const getIds = createGetIds();
	const aggregateKeys = Object.keys(span.aggregates);
	const aliasPrefix = span._alias ? 's' + span._alias : null;
	const aliasProbeIndex = selectedColumns.length ? selectedColumns[0].index : 0;
	const useAlias = aliasPrefix && rowsLength > 0 && hasKey(rows[0], aliasPrefix + aliasProbeIndex);

	const outRows = new Array(rowsLength);
	const createRow = newCreateRow(span);
	const shouldCreateMap = hasManyRelations(span);
	for (let i = 0; i < rowsLength; i++) {
		const row = rows[i];
		const lookup = useAlias ? createLookup(row) : null;
		let outRow = createRow();
		let pkWithNullCount = 0;
		for (let j = 0; j < columnsLength; j++) {
			const { column, index } = selectedColumns[j];
			const key = useAlias ? (aliasPrefix + index) : keys[j];
			if (j < primaryColumnsLength) {
				const value = useAlias ? getValue(row, lookup, key) : row[key];
				if (value === null)
					pkWithNullCount++;
				if (pkWithNullCount === primaryColumnsLength) {
					outRow = null;
					break;
				}
			}
			const value = useAlias ? getValue(row, lookup, key) : row[key];
			outRow[column.alias] = column.decode(context, value);
		}

		for (let j = 0; j < aggregateKeys.length; j++) {
			const aggKey = aggregateKeys[j];
			const parse = span.aggregates[aggKey].column?.decode || ((context, arg) => Number.parseFloat(arg));
			const value = useAlias ? getValue(row, lookup, aggKey) : row[keys[j + columnsLength]];
			outRow[aggKey] = parse(context, value);
		}

		outRows[i] = outRow;
		if (updateParent)
			updateParent(outRow, i);
		if (shouldCreateMap) {
			fkIds[i] = getIds(outRow);
			addToMap(rowsMap, fkIds[i], outRow);
		}
	}
	span._rowsMap = rowsMap;
	span._ids = fkIds;

	if (!useAlias)
		keys.splice(0, columnsLength + aggregateKeys.length);
	if (span.legs.toArray().length === 0)
		return outRows;

	const all = [];

	if (shouldCreateMap) {
		all.push(decodeManyRelations(context, strategy, span));
		all.push(decodeRelations2(context, strategy, span, rows, outRows, keys));
	}
	else
		all.push(decodeRelations2(context, strategy, span, rows, outRows, keys));

	await Promise.all(all);

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

function hasKey(row, key) {
	if (Object.prototype.hasOwnProperty.call(row, key))
		return true;
	const lower = key.toLowerCase();
	for (const k in row) {
		if (k.toLowerCase() === lower)
			return true;
	}
	return false;
}

function createLookup(row) {
	const map = new Map();
	for (const k in row) {
		map.set(k.toLowerCase(), k);
	}
	return map;
}

function getValue(row, lookup, key) {
	if (Object.prototype.hasOwnProperty.call(row, key))
		return row[key];
	const resolved = lookup.get(key.toLowerCase());
	if (resolved)
		return row[resolved];
	return row[key];
}

async function decodeManyRelations(context, strategy, span) {
	const maxParameters = getSessionSingleton(context, 'maxParameters');
	const maxRows = maxParameters
		? maxParameters * span.table._primaryColumns.length
		: undefined;

	const promises = [];
	const c = {};
	c.visitJoin = () => { };
	c.visitOne = c.visitJoin;

	// Helper function to split an array into chunks
	function chunk(array, size) {
		const results = [];
		for (let i = 0; i < array.length; i += size) {
			results.push(array.slice(i, i + size));
		}
		return results;
	}

	c.visitMany = function(leg) {
		const name = leg.name;
		const table = span.table;
		const relation = table._relations[name];
		const rowsMap = span._rowsMap;

		const extractKey = createExtractKey(leg);
		const extractFromMap = createExtractFromMap(rowsMap, table._primaryColumns);

		if (span._ids.length === 0) {
			return;
		}

		// If maxRows is defined, chunk the IDs before calling getManyDto
		if (maxRows) {
			const chunkedIds = chunk(span._ids, maxRows);
			for (const idsChunk of chunkedIds) {
				const filter = createOneFilter(context, relation, idsChunk);
				const p = getManyDto(
					context,
					relation.childTable,
					filter,
					strategy[name],
					leg.span,
					updateParent
				);
				promises.push(p);
			}
		} else {
			// Otherwise, do the entire set in one go
			const filter = createOneFilter(context, relation, span._ids);
			const p = getManyDto(
				context,
				relation.childTable,
				filter,
				strategy[name],
				leg.span,
				updateParent
			);
			promises.push(p);
		}

		function updateParent(subRow) {
			const key = extractKey(subRow);
			const parentRows = extractFromMap(key) || [];
			parentRows.forEach(parentRow => {
				parentRow[name].push(subRow);
			});
		}
	};

	function createExtractKey(leg) {
		if (leg.columns.length === 1) {
			const alias = leg.columns[0].alias;
			return (row) => row[alias];
		} else {
			const aliases = leg.columns.map(column => column.alias);
			return (row) => aliases.map(alias => row[alias]);
		}
	}

	function createExtractFromMap(map, primaryColumns) {
		if (primaryColumns.length === 1) {
			return (key) => map.get(key);
		} else {
			return getFromMap.bind(null, map, primaryColumns);
		}
	}

	// Visit all legs
	span.legs.forEach(onEachLeg);

	function onEachLeg(leg) {
		leg.accept(c);
	}

	// Wait until all promises resolve
	await Promise.all(promises);
}

async function decodeRelations2(context, strategy, span, rawRows, resultRows, keys) {
	const c = {};
	c.visitJoin = function(leg) {
		const name = leg.name;
		return decode(context, strategy[name], leg.span, rawRows, keys, updateParent);

		function updateParent(subRow, i) {
			if (resultRows[i])
				resultRows[i][name] = subRow;
		}
	};

	c.visitOne = c.visitJoin;
	c.visitMany = () => { };

	async function processLegsSequentially(legs) {
		for (const leg of legs.toArray()) {
			await leg.accept(c);
		}
	}

	await processLegsSequentially(span.legs);
}

function createOneFilter(context, relation, ids) {
	const columns = relation.joinRelation.columns;

	if (columns.length === 1)
		return columns[0].in(context, ids);

	else
		return createCompositeFilter();

	function createCompositeFilter() {
		let filter = emptyFilter;
		for (let id of ids) {
			let nextFilter;
			for (let i = 0; i < columns.length; i++) {
				if (nextFilter)
					nextFilter = nextFilter.and(context, columns[i].eq(context, id[i]));
				else
					nextFilter = columns[i].eq(context, id[i]);
			}
			filter = filter.or(context, nextFilter);
		}
		return filter;
	}
}

function addToMap(map, values, row) {
	if (Array.isArray(values)) {
		let m = map;
		const lastIndex = values.length - 1;
		for (let i = 0; i < lastIndex; i++) {
			const id = values[i];
			if (!m.has(id)) {
				m.set(id, new Map());
			}
			m = m.get(id);
		}
		const leafKey = values[lastIndex];
		if (!m.has(leafKey)) {
			m.set(leafKey, [row]);
		} else {
			m.get(leafKey).push(row);
		}
	}
	else {
		if (!map.has(values)) {
			map.set(values, [row]);
		} else {
			map.get(values).push(row);
		}
	}
}

function getFromMap(map, primaryColumns, values) {
	if (Array.isArray(values)) {
		const length = primaryColumns.length;
		for (let i = 0; i < length; i++) {
			map = map.get(values[i]);
		}
		return map;
	}
	else
		return map.get(values);
}

module.exports = getManyDto;
