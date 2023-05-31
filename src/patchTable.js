/* eslint-disable require-atomic-updates */
let applyPatch = require('./applyPatch');
let fromCompareObject = require('./fromCompareObject');
let validateDeleteConflict = require('./validateDeleteConflict');
let validateDeleteAllowed = require('./validateDeleteAllowed');

async function patchTable() {
	// const dryrun = true;
	//traverse all rows you want to update before updatinng or inserting anything.
	//this is to avoid page locks in ms sql
	// await patchTableCore.apply(null, [...arguments, dryrun]);
	return patchTableCore.apply(null, arguments);
}

async function patchTableCore(table, patches, { strategy = undefined, deduceStrategy = false, ...options } = {}, dryrun) {
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
	return { changed: await toDtos(changed), strategy };

	async function toDtos(set) {
		set = [...set];
		let result = [];
		for (let i = 0; i < set.length; i++) {
			result.push(await set[i].toDto(strategy));
		}
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
			const key = toKey(property);
			row =  await table.tryGetById.apply(null, toKey(property), strategy);
			if (!row)
				throw new Error(`Row ${table._dbName} with id ${key} was not found.`);
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
			let row = table.insert.apply(null, [value]);

			if (relation && relation.joinRelation) {
				for (let i = 0; i < relation.joinRelation.columns.length; i++) {
					let column = relation.joinRelation.columns[i];
					let fkName = column.alias;
					let parentPk = relation.joinRelation.childTable._primaryColumns[i].alias;
					if (!row[fkName]) {
						row[fkName] = parentRow[parentPk];
					}
				}
			}
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
			let dto = {};
			dto[property] = row[property];
			let result = applyPatch({ options }, dto, [{ path: '/' + path.join('/'), op, value, oldValue }]);
			row[property] = result[property];
			return { updated: row };
		}
		else if (isOneRelation(property, table)) {
			let relation = table[property]._relation;
			let subRow = await row[property];
			if (!subRow)
				throw new Error(`${property} was not found`);
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
		row = row || await table.getById.apply(null, toKey(property));
		if (path.length === 0) {
			await validateDeleteAllowed({ row, options, table });
			if (await validateDeleteConflict({ row, oldValue, options, table }))
				await row.deleteCascade();
		}
		property = path[0];
		if (isColumn(property, table)) {
			let dto = {};
			dto[property] = row[property];
			let result = applyPatch({ options }, dto, [{ path: '/' + path.join('/'), op, oldValue }]);
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

	function isManyRelation(name, table) {
		return table[name] && table[name]._relation.isMany;
	}

	function isOneRelation(name, table) {
		return table[name] && table[name]._relation.isOne;

	}

	function isJoinRelation(name, table) {
		return table[name] && table[name]._relation.columns;
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