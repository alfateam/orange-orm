/* eslint-disable require-atomic-updates */
let applyPatch = require('./applyPatch');
let fromCompareObject = require('./fromCompareObject');
let validateDeleteAllowed = require('./validateDeleteAllowed');
let clearCache = require('./table/clearCache');
const getSessionSingleton = require('./table/getSessionSingleton');


async function patchTable() {
	// const dryrun = true;
	//traverse all rows you want to update before updatinng or inserting anything.
	//this is to avoid page locks in ms sql
	// await patchTableCore.apply(null, [...arguments, dryrun]);
	const result = await patchTableCore.apply(null, arguments);
	clearCache(arguments[0]);
	return result;
}

async function patchTableCore(context, table, patches, { strategy = undefined, deduceStrategy = false, ...options } = {}, dryrun) {
	const engine = getSessionSingleton(context, 'engine');
	options = cleanOptions(options);
	strategy = JSON.parse(JSON.stringify(strategy || {}));
	let changed = new Set();
	for (let i = 0; i < patches.length; i++) {
		let patch = { path: undefined, value: undefined, op: undefined };
		Object.assign(patch, patches[i]);
		patch.path = patches[i].path.split('/').slice(1);
		let result;
		if (patch.op === 'add' || patch.op === 'replace') {
			result = await add({ path: patch.path, value: patch.value, op: patch.op, oldValue: patch.oldValue, strategy: deduceStrategy ? strategy : {}, options }, table);
		}
		else if (patch.op === 'remove')
			result = await remove({ path: patch.path, op: patch.op, oldValue: patch.oldValue, options }, table);

		if (result.inserted)
			changed.add(result.inserted);
		else if (result.updated)
			changed.add(result.updated);
	}
	if (strategy['insertAndForget'])
		return {
			changed: [], strategy
		};
	return { changed: await toDtos(changed), strategy };


	async function toDtos(set) {
		set = [...set];
		const result = await table.getManyDto(context, set, strategy);
		return result;
	}

	function toKey(property) {
		if (typeof property === 'string' && property.charAt(0) === '[')
			return JSON.parse(property);
		else
			return [property];
	}

	async function add({ path, value, op, oldValue, strategy, options }, table, row, parentRow, relation) {
		let property = path[0];
		path = path.slice(1);
		if (!row && path.length > 0) {
			row = await getOrCreateRow({
				table,
				strategy,
				property
			});
		}

		if (path.length === 0 && value === null) {
			return remove({ path, op, oldValue, options }, table, row);
		}
		if (path.length === 0) {
			if (dryrun) {
				return {};
			}
			let childInserts = [];
			for (let name in value) {
				if (isColumn(name, table))
					value[name] = fromCompareObject(value[name]);
				else if (isJoinRelation(name, table)) {
					strategy[name] = strategy[name] || {};
					value[name] && updateJoinedColumns(name, value, table, value);
				}
				else if (isManyRelation(name, table))
					value[name] && childInserts.push(insertManyRelation.bind(null, name, value, op, oldValue, table, strategy, options));
				else if (isOneRelation(name, table) && value)
					value[name] && childInserts.push(insertOneRelation.bind(null, name, value, op, oldValue, table, strategy, options));
			}
			for (let i = 0; i < table._primaryColumns.length; i++) {
				let pkName = table._primaryColumns[i].alias;
				let keyValue = value[pkName];
				if (keyValue && typeof (keyValue) === 'string' && keyValue.indexOf('~') === 0)
					value[pkName] = undefined;
			}

			if (relation && relation.joinRelation) {
				for (let i = 0; i < relation.joinRelation.columns.length; i++) {
					let column = relation.joinRelation.columns[i];
					let fkName = column.alias;
					let parentPk = relation.joinRelation.childTable._primaryColumns[i].alias;
					if (!value[fkName]) {
						value[fkName] = parentRow[parentPk];
					}
				}
			}
			let row = table.insertWithConcurrency.apply(null, [context, options, value]);
			row = await row;

			for (let i = 0; i < childInserts.length; i++) {
				await childInserts[i](row);
			}
			return { inserted: row };
		}
		property = path[0];
		if (isColumn(property, table)) {
			if (dryrun)
				return { updated: row };
			const column = table[property];
			const oldColumnValue = row[property];
			let dto = {};
			dto[property] = oldColumnValue;
			const _oldValue = fromCompareObject(oldValue);
			const _value = fromCompareObject(value);
			let result = applyPatch({ options, context }, dto, [{ path: '/' + path.join('/'), op, value, oldValue }], table[property]);

			const patchInfo = column.tsType === 'JSONColumn' ? {
				path,
				op,
				value: _value,
				oldValue : _oldValue,
				fullOldValue: oldColumnValue
			} : undefined;
			await table.updateWithConcurrency(context, options, row, property, result[property], _oldValue, patchInfo);
			return { updated: row };
		}
		else if (isOneRelation(property, table)) {
			let relation = table[property]._relation;
			let subRow = await row[property];
			strategy[property] = strategy[property] || {};
			options[property] = inferOptions(options, property);

			await add({ path, value, op, oldValue, strategy: strategy[property], options: options[property] }, relation.childTable, subRow, row, relation);
			return { updated: row };
		}
		else if (isManyRelation(property, table)) {
			let relation = table[property]._relation;
			strategy[property] = strategy[property] || {};
			options[property] = inferOptions(options, property);


			if (path.length === 1) {
				for (let id in value) {
					if (id === '__patchType')
						continue;
					await add({ path: [id], value: value[id], op, oldValue, strategy: strategy[property], options: options[property] }, relation.childTable, undefined, row, relation);
				}
			}
			else {
				await add({ path: path.slice(1), value, oldValue, op, strategy: strategy[property], options: options[property] }, relation.childTable, undefined, row, relation);
			}
			return { updated: row };
		}
		else if (isJoinRelation(property, table) && path.length === 1) {
			let dto = toJoinedColumns(property, { [property]: value }, table);
			oldValue = toJoinedColumns(property, { [property]: oldValue }, table);
			let result;
			for (let p in dto) {
				result = await add({ path: ['dummy', p], value: dto[p], oldValue: (oldValue || {})[p], op, strategy: strategy, options: options }, table, row, parentRow, relation) || result;
			}
			return result || {};
		}
		else if (isJoinRelation(property, table) && path.length === 2) {
			let dto = toJoinedColumns(property, { [property]: { [path[1]]: value } }, table);
			oldValue = toJoinedColumns(property, { [property]: { [path[1]]: oldValue } }, table);
			let result;
			for (let p in dto) {
				result = await add({ path: ['dummy', p], value: dto[p], oldValue: (oldValue || {})[p], op, strategy: strategy, options: options }, table, row, parentRow, relation) || result;
			}
			return result || {};
		}
		return {};
	}

	async function insertManyRelation(name, value, op, oldValue, table, strategy, options, row) {
		let relation = table[name]._relation;
		for (let childKey in value[name]) {
			if (childKey != '__patchType') {
				let child = value[name][childKey];
				strategy[name] = strategy[name] || {};
				options[name] = inferOptions(options, name);

				await add({ path: [childKey], value: child, op, oldValue, strategy: strategy[name], options: options[name] }, relation.childTable, {}, row, relation);
			}
		}
	}

	async function insertOneRelation(name, value, op, oldValue, table, strategy, options, row) {
		let relation = table[name]._relation;
		let child = value[name];
		strategy[name] = strategy[name] || {};
		options[name] = inferOptions(options, name);

		await add({ path: [name], value: child, op, oldValue, strategy: strategy[name], options: options[name] }, relation.childTable, {}, row, relation);
	}

	function updateJoinedColumns(name, value, table, row) {
		let relation = table[name]._relation;
		for (let i = 0; i < relation.columns.length; i++) {
			let parentKey = relation.columns[i].alias;
			let childKey = relation.childTable._primaryColumns[i].alias;
			if (childKey in value[name])
				row[parentKey] = fromCompareObject(value[name][childKey]);
		}
	}
	function toJoinedColumns(name, valueObject, table) {
		let relation = table[name]._relation;
		let dto = {};
		for (let i = 0; i < relation.columns.length; i++) {
			let parentKey = relation.columns[i].alias;
			let childKey = relation.childTable._primaryColumns[i].alias;
			if (valueObject && valueObject[name] && childKey in valueObject[name])
				dto[parentKey] = fromCompareObject(valueObject[name][childKey]);
			else
				dto[parentKey] = null;
		}
		return dto;
	}

	async function remove({ path, op, oldValue, options }, table, row) {
		let property = path[0];
		path = path.slice(1);
		if (!row)
			row = await getOrCreateRow({ table, strategy: {}, property });
		if (path.length === 0) {
			await validateDeleteAllowed({ row, options, table });
			applyDeleteConcurrencyState(row, oldValue, options, table);
			await row.deleteCascade();
		}
		property = path[0];
		if (isColumn(property, table)) {
			const column = table[property];
			const oldColumnValue = row[property];
			let dto = {};
			dto[property] = oldColumnValue;
			const _oldValue = fromCompareObject(oldValue);

			let result = applyPatch({ options, context }, dto, [{ path: '/' + path.join('/'), op, oldValue }], table[property]);
			if (column.tsType === 'JSONColumn') {
				const patchInfo = {
					path,
					op,
					value: undefined,
					oldValue: _oldValue,
					fullOldValue: oldColumnValue
				};
				await table.updateWithConcurrency(context, options, row, property, result[property], _oldValue, patchInfo);
			}
			else
				row[property] = result[property];
			return { updated: row };
		}
		else if (isJoinRelation(property, table) && path.length === 1) {
			oldValue = toJoinedColumns(property, { [property]: oldValue }, table);
			let relation = table[property]._relation;
			let result;
			for (let i = 0; i < relation.columns.length; i++) {
				let p = relation.columns[i].alias;
				let dto = {};
				dto[p] = row[p];
				result = await remove({ path: ['dummy', p], oldValue: (oldValue || {})[p], op, options: options }, table, row) || result;
			}
			return result || {};
		}
		else if (isJoinRelation(property, table) && path.length === 2) {
			let relation = table[property]._relation;
			oldValue = toJoinedColumns(property, { [property]: { [path[1]]: oldValue } }, table);
			let result;
			for (let i = 0; i < relation.columns.length; i++) {
				let p = relation.columns[i].alias;
				let childKey = relation.childTable._primaryColumns[i].alias;
				if (path[1] === childKey) {
					let dto = {};
					dto[p] = row[p];
					result = await remove({ path: ['dummy', p], oldValue: (oldValue || {})[p], op, options: options }, table, row) || result;
					break;
				}
			}
			return result || {};
		}
		else if (isOneRelation(property, table)) {
			let child = await row[property];
			if (!child)
				throw new Error(property + ' does not exist');
			options[property] = inferOptions(options, property);

			await remove({ path, op, oldValue, options: options[property] }, table[property], child);
			return { updated: row };
		}
		else if (isManyRelation(property, table)) {
			let relation = table[property]._relation;
			options[property] = inferOptions(options, property);
			if (path.length === 1) {
				let children = (await row[property]).slice(0);
				for (let i = 0; i < children.length; i++) {
					let child = children[i];
					await remove({ path: path.slice(1), op, oldValue, options: options[property] }, table[property], child);
				}
			}
			else {
				await remove({ path: path.slice(1), op, oldValue, options: options[property] }, relation.childTable);
			}
			return { updated: row };
		}
		return {};
	}

	function isColumn(name, table) {
		return table[name] && table[name].equal;
	}

	function shouldFetchFromDb(table) {
		return engine === 'sap'
			&& table._columns.some(x => x.tsType === 'JSONColumn');
	}


	function getOrCreateRow({ table, strategy, property }) {
		const key = toKey(property);

		if (shouldFetchFromDb(table))
			return fetchFromDb({context, table, strategy, key});
		return createRowInCache({ context, table, key });
	}

	async function fetchFromDb({context, table, strategy, key}) {
		const row = await table.tryGetById.apply(null, [context, ...key, strategy]);
		if (!row)
			throw new Error(`Row ${table._dbName} with id ${key} was not found.`);
		return row;

	}



	function createRowInCache({ context, table, key }) {
		const newRow = getOrCreateRow.cachedNewRow || (getOrCreateRow.cachedNewRow = require('./table/commands/newRow'));
		const pkDto = {};
		for (let i = 0; i < key.length && i < table._primaryColumns.length; i++) {
			pkDto[table._primaryColumns[i].alias] = key[i];
		}
		let row = newRow(context, { table, shouldValidate: false }, pkDto);
		return table._cache.tryAdd(context, row);
	}

	function isManyRelation(name, table) {
		return table[name] && table[name]._relation.isMany;
	}

	function isOneRelation(name, table) {
		return table[name] && table[name]._relation.isOne;

	}

	function isJoinRelation(name, table) {
		return table[name] && table[name]._relation.columns;
	}

	function applyDeleteConcurrencyState(row, oldValue, options, table) {
		const state = { columns: {} };
		if (oldValue && oldValue === Object(oldValue)) {
			for (let p in oldValue) {
				if (!isColumn(p, table))
					continue;
				const columnOptions = inferOptions(options, p);
				const concurrency = columnOptions.concurrency || 'optimistic';
				if (concurrency === 'overwrite')
					continue;
				state.columns[p] = { oldValue: fromCompareObject(oldValue[p]), concurrency };
			}
		}
		if (Object.keys(state.columns).length === 0) {
			const concurrency = options.concurrency || 'optimistic';
			if (concurrency !== 'overwrite') {
				for (let i = 0; i < table._primaryColumns.length; i++) {
					const pkName = table._primaryColumns[i].alias;
					state.columns[pkName] = { oldValue: row[pkName], concurrency };
				}
			}
		}
		if (Object.keys(state.columns).length > 0)
			row._concurrencyState = state;
	}

	function inferOptions(defaults, property) {
		const parent = {};
		if ('readonly' in defaults)
			parent.readonly = defaults.readonly;
		if ('concurrency' in defaults)
			parent.concurrency = defaults.concurrency;
		return { ...parent, ...(defaults[property] || {}) };
	}

	function cleanOptions(options) {
		const { table, transaction, db, ..._options } = options;
		return _options;
	}
}

module.exports = patchTable;
