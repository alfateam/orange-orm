/* eslint-disable require-atomic-updates */
let applyPatch = require('./applyPatch');

async function patchTable(table, patches, { defaultConcurrency = 'optimistic', concurrency = {}, strategy = undefined}  = {},) {
	let updated = new Set();
	let inserted = new Set();
	for (let i = 0; i < patches.length; i++) {
		let patch = {path: undefined, value: undefined, op: undefined};
		Object.assign(patch, patches[i]);
		patch.path = patches[i].path.split('/').slice(1);
		if (patch.op === 'add' || patch.op === 'replace') {
			let result = await add({ path: patch.path, value: patch.value, op: patch.op, oldValue: patch.oldValue, concurrency: concurrency }, table);
			if (result.inserted)
				inserted.add(result.inserted);
			else if (result.updated)
				updated.add(result.updated);
		}
		else if (patch.op === 'remove')
			await remove(patch, table);
	}

	return { updated: await toDtos(updated), inserted: await toDtos(inserted)};

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

	async function add({ path, value, op, oldValue, concurrency = {} }, table, row, parentRow, relation) {
		let property = path[0];
		path = path.slice(1);
		if (!row && path.length > 0)
			row = row || await table.tryGetById.apply(null, toKey(property), strategy);
		if (path.length === 0) {
			for (let i = 0; i < table._primaryColumns.length; i++) {
				let pkName = table._primaryColumns[i].alias;
				let keyValue = value[pkName];
				if (keyValue && typeof(keyValue) === 'string' && keyValue.indexOf('~') === 0)
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

			let childInserts = [];
			for (let name in value) {
				if (isColumn(name, table))
					continue;
				else if (isManyRelation(name, table)) {
					let relation = table[name]._relation;
					for(let childKey in value[name]) {
						if (childKey != '__patchType') {
							let child = value[name][childKey];
							childInserts.push(add.bind(null, { path: [childKey], value: child, op, oldValue, concurrency: concurrency[name] }, relation.childTable, {}, row, relation));
						}
					}
				}
				else if (isOneRelation(name, table)) {
					let relation = table[name]._relation;
					let child = value[name];
					childInserts.push(add.bind(null, { path: [name], value: child, op, oldValue, concurrency: concurrency[name] }, relation.childTable, {}, row, relation));
				}
			}
			for (let i = 0; i < childInserts.length; i++) {
				await childInserts[i]();
			}
			return {inserted: row};
		}
		property = path[0];
		if (isColumn(property, table)) {
			let dto = {};
			dto[property] = row[property];
			let result = applyPatch({ defaultConcurrency, concurrency }, dto, [{ path: '/' + path.join('/'), op, value, oldValue }]);
			row[property] = result[property];
			return {updated: row};
		}
		else if (isOneRelation(property, table)) {
			let relation = table[property]._relation;
			await add({ path, value, op, oldValue, concurrency: concurrency[property] }, relation.childTable, await row[property], row, relation);
			return {updated: row};
		}
		else if (isManyRelation(property, table)) {
			let relation = table[property]._relation;
			if (path.length === 1) {
				for (let id in value) {
					await add({ path: [id], value: value[id], op, oldValue, concurrency: concurrency[property] }, relation.childTable, {}, row, relation);
				}
			}
			else
				await add({ path: path.slice(1), value, oldValue, op, concurrency: concurrency[property] }, relation.childTable, undefined, row, relation);
			return {updated: row};
		}
		return {};
	}

	async function remove({ path, value, op }, table, row) {
		let property = path[0];
		path = path.slice(1);
		row = row || await table.getById.apply(null, toKey(property));
		if (path.length === 0)
			return row.cascadeDelete();
		property = path[0];
		if (isColumn(property, table)) {
			let dto = {};
			dto[property] = row[property];
			let result = applyPatch({defaultConcurrency: 'overwrite', concurrency: undefined}, dto, [{ path: '/' + path.join('/'), op }]);
			row[property] = result[property];
		}
		else if (isOneRelation(property, table)) {
			let child = await row[property];
			if (!child)
				throw new Error(property + ' does not exist');
			await remove({ path, value, op }, table[property], child);
		}
		else if (isManyRelation(property, table)) {
			let relation = table[property]._relation;
			if (path.length === 1) {
				let children = (await row[property]).slice(0);
				for (let i = 0; i < children.length; i++) {
					let child = children[i];
					await remove({ path: path.slice(1), value, op }, table[property], child);
				}
			}
			else
				await remove({ path: path.slice(1), value, op }, relation.childTable);
		}
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
}

module.exports = patchTable;