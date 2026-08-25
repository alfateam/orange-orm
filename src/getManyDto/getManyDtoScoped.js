const getManyDto = require('../getManyDto.js');
const newQuery = require('./newQuery');
const strategyToSpan = require('../table/strategyToSpan');
const executeQueries = require('../table/executeQueries');
const getSessionSingleton = require('../table/getSessionSingleton');
const newParameterized = require('../table/query/newParameterized');
const extractOrderBy = require('../table/query/extractOrderBy');

const scopeAlias = '__rdb_s';
const ownerColumnAlias = '__rdb_o';
const resultOwnerAlias = '__rdb_owner';
const rowNumberAlias = '__rdb_rn';
const pagedRowsAlias = '__rdb_paged';

module.exports = async function getManyDtoScoped({
	context,
	table,
	filter,
	scopeFilter,
	strategy,
	scopeColumns,
	scopeRows,
	offset,
	limit
}) {
	if (scopeRows.length === 0)
		return [];

	const quote = getSessionSingleton(context, 'quote');
	const span = strategyToSpan(table, strategy);
	const alias = table._dbName;
	const scopeSource = newScopeSource(context, scopeColumns, scopeRows);
	const scopeJoin = scopeSource
		.prepend(' INNER JOIN ')
		.append(' ON ')
		.append(scopeFilter);
	const ownerSelect = `${quote(scopeAlias)}.${quote(ownerColumnAlias)} as ${quote(resultOwnerAlias)},`;
	const useWindowPagination = shouldUseWindowPagination(getSessionSingleton(context, 'engine'), offset, limit);
	const orderBy = extractOrderBy(context, table, alias, span.orderBy);
	const rowNumberSelect = useWindowPagination
		? `ROW_NUMBER() OVER (PARTITION BY ${quote(scopeAlias)}.${quote(ownerColumnAlias)}${orderBy}) as ${quote(rowNumberAlias)},`
		: '';
	let query = newQuery(context, table, filter, span, alias, {
		extraSelect: ownerSelect + rowNumberSelect,
		fromSuffix: scopeJoin,
		...(useWindowPagination ? { orderBy: '' } : {})
	});
	if (useWindowPagination)
		query = applyWindowPagination(query, quote, offset, limit);
	const resultSets = await executeQueries(context, [query]);
	const rawRows = await resultSets[0];
	const ownerIds = new Array(rawRows.length);
	const resultKeys = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
	const ownerKey = resultKeys[0];
	const rowNumberKey = useWindowPagination ? resultKeys[1] : undefined;
	for (let i = 0; i < rawRows.length; i++) {
		ownerIds[i] = Number(rawRows[i][ownerKey]);
		delete rawRows[i][ownerKey];
		if (useWindowPagination)
			delete rawRows[i][rowNumberKey];
	}
	const rows = await getManyDto.decode(context, strategy, span, rawRows);
	return rows.map((row, index) => ({ ownerId: ownerIds[index], row }));
};

module.exports.newScopeColumnRef = function newScopeColumnRef(context, alias) {
	const quote = getSessionSingleton(context, 'quote');
	return {
		_toFilterArg() {
			return newParameterized(`${quote(scopeAlias)}.${quote(alias)}`);
		}
	};
};

function newScopeSource(context, scopeColumns, scopeRows) {
	const quote = getSessionSingleton(context, 'quote');
	const engine = getSessionSingleton(context, 'engine');
	let result = newParameterized('(');
	for (let rowIndex = 0; rowIndex < scopeRows.length; rowIndex++) {
		if (rowIndex > 0)
			result = result.append(' UNION ALL ');
		result = result.append('SELECT ' + scopeRows[rowIndex].ownerId);
		if (rowIndex === 0)
			result = result.append(' as ' + quote(ownerColumnAlias));
		for (let columnIndex = 0; columnIndex < scopeColumns.length; columnIndex++) {
			const scopeColumn = scopeColumns[columnIndex];
			let encoded = scopeColumn.column.encode(context, scopeColumn.value(scopeRows[rowIndex]));
			encoded = castScopeValue(engine, scopeColumn.column, encoded);
			result = result.append(',').append(encoded);
			if (rowIndex === 0)
				result = result.append(' as ' + quote(scopeColumn.alias));
		}
		if (engine === 'oracle')
			result = result.append(' FROM DUAL');
	}
	return result.append(') ' + quote(scopeAlias));
}

function castScopeValue(engine, column, encoded) {
	if (engine !== 'pg')
		return encoded;
	const type = {
		BigintColumn: 'bigint',
		BinaryColumn: 'bytea',
		BooleanColumn: 'boolean',
		DateColumn: 'timestamp',
		JSONColumn: 'jsonb',
		StringColumn: 'text',
		UUIDColumn: 'uuid'
	}[column.tsType];
	if (!type)
		return encoded;
	return encoded.prepend('CAST(').append(` AS ${type})`);
}

function shouldUseWindowPagination(engine, offset, limit) {
	return engine !== 'sap' && ((offset || 0) > 0 || limit !== undefined);
}

function applyWindowPagination(query, quote, offset = 0, limit) {
	let result = query
		.prepend('SELECT * FROM (')
		.append(') ' + quote(pagedRowsAlias))
		.append(` WHERE ${quote(pagedRowsAlias)}.${quote(rowNumberAlias)} > ${offset}`);
	if (limit !== undefined)
		result = result.append(` AND ${quote(pagedRowsAlias)}.${quote(rowNumberAlias)} <= ${offset + limit}`);
	return result.append(` ORDER BY ${quote(pagedRowsAlias)}.${quote(resultOwnerAlias)},${quote(pagedRowsAlias)}.${quote(rowNumberAlias)}`);
}
