const newParameterized = require('../table/query/newParameterized');
const clearCache = require('../table/clearCache');
const encodeBoolean = require('../sqlite/encodeBoolean');
const encodeBinary = require('../nodeSqlite/encodeBinary');
const quoteSqlite = require('../sqlite/quote');

const sqliteEncodeContext = {
	rdb: {
		engine: 'sqlite',
		encodeBoolean,
		encodeBinary,
		encodeJSON: JSON.stringify,
		quote: quoteSqlite
	}
};

async function applySyncRowsOnTx(tx, items) {
	const rows = Array.isArray(items) ? items : [];
	const perTable = new Map();
	for (let i = 0; i < rows.length; i++) {
		const item = rows[i];
		if (!item || typeof item.table !== 'string' || !Array.isArray(item.pk) || item.row === undefined)
			continue;
		if (!perTable.has(item.table))
			perTable.set(item.table, []);
		perTable.get(item.table).push(item);
	}
	const tableNames = orderTablesByDependencies(tx, Array.from(perTable.keys()));
	let applied = 0;
	for (let i = 0; i < tableNames.length; i++) {
		const tableName = tableNames[i];
		const table = tx[tableName];
		if (!table)
			throw new Error(`Table "${tableName}" does not exist in this client`);
		const entries = perTable.get(tableName);
		for (let rowIndex = 0; rowIndex < entries.length; rowIndex++) {
			await upsertRow(tx, table, entries[rowIndex].row);
			applied += 1;
		}
		if (tx && tx.rdb)
			clearCache(tx);
	}
	return applied;
}

async function upsertRow(tx, table, row) {
	const command = newUpsertCommand(tx, table, row);
	if (!command)
		return;
	await tx.query(command);
}

function newUpsertCommand(context, table, row) {
	const encodeContext = context && context.rdb ? context : sqliteEncodeContext;
	const columns = table._columns || [];
	const insertColumns = [];
	const values = [];
	const parameters = [];
	const updateColumns = [];
	for (let i = 0; i < columns.length; i++) {
		const column = columns[i];
		if (!Object.prototype.hasOwnProperty.call(row, column.alias))
			continue;
		const encoded = column.encode(encodeContext, row[column.alias]);
		insertColumns.push(quote(context, column._dbName));
		values.push(encoded.sql());
		if (encoded.parameters.length > 0)
			parameters.push(encoded.parameters[0]);
		if (!column.isPrimary)
			updateColumns.push(`${quote(context, column._dbName)}=excluded.${quote(context, column._dbName)}`);
	}
	if (insertColumns.length === 0)
		return null;
	const primaryKeys = (table._primaryColumns || []).map(column => quote(context, column._dbName));
	const conflict = primaryKeys.length === 0
		? ''
		: ` ON CONFLICT(${primaryKeys.join(',')}) ${updateColumns.length > 0 ? `DO UPDATE SET ${updateColumns.join(',')}` : 'DO NOTHING'}`;
	const sql = `INSERT INTO ${quote(context, table._dbName)} (${insertColumns.join(',')}) VALUES (${values.join(',')})${conflict}`;
	return newParameterized(sql, parameters);
}

function orderTablesByDependencies(client, tableNames) {
	if (!Array.isArray(tableNames) || tableNames.length <= 1)
		return tableNames || [];
	const dependencyMap = buildDependencyMap(client);
	const pending = new Set(tableNames);
	const ordered = [];
	while (pending.size > 0) {
		let progressed = false;
		for (let i = 0; i < tableNames.length; i++) {
			const name = tableNames[i];
			if (!pending.has(name))
				continue;
			const deps = dependencyMap.get(name) || new Set();
			let blocked = false;
			for (let dep of deps) {
				if (pending.has(dep)) {
					blocked = true;
					break;
				}
			}
			if (!blocked) {
				pending.delete(name);
				ordered.push(name);
				progressed = true;
			}
		}
		if (!progressed) {
			for (let i = 0; i < tableNames.length; i++) {
				const name = tableNames[i];
				if (pending.has(name)) {
					pending.delete(name);
					ordered.push(name);
				}
			}
		}
	}
	return ordered;
}

function buildDependencyMap(client) {
	const dependencyMap = new Map();
	const tables = client && client.tables ? client.tables : {};
	const names = Object.keys(tables);
	const nameByTableObject = new Map();
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		const table = tables[name];
		if (table)
			nameByTableObject.set(table, name);
		dependencyMap.set(name, new Set());
	}

	for (let i = 0; i < names.length; i++) {
		const table = tables[names[i]];
		if (!table || !table._relations)
			continue;
		const relations = table._relations;
		for (const relationName of Object.keys(relations)) {
			const relation = relations[relationName];
			const join = extractJoinRelation(relation);
			if (!join)
				continue;
			const fromName = nameByTableObject.get(join.parentTable);
			const toName = nameByTableObject.get(join.childTable);
			if (!fromName || !toName || fromName === toName)
				continue;
			dependencyMap.get(fromName).add(toName);
		}
	}
	return dependencyMap;
}

function extractJoinRelation(relation) {
	if (!relation || typeof relation.accept !== 'function')
		return;
	let join;
	relation.accept({
		visitJoin(current) {
			join = current;
		},
		visitOne(current) {
			join = current && current.joinRelation;
		},
		visitMany(current) {
			join = current && current.joinRelation;
		}
	});
	return join;
}

function quote(context, name) {
	const rdb = context && context.rdb;
	if (rdb && typeof rdb.quote === 'function')
		return rdb.quote(name);
	return `"${String(name).replace(/"/g, '""')}"`;
}

module.exports = { applySyncRowsOnTx };
