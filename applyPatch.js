/* eslint-disable require-atomic-updates */
let applyPatchToColumn = require('./applyPatchToColumn');

async function applyPatch(table, patches) {
	for (let i = 0; i < patches.length; i++) {
		let patch = {};
		Object.assign(patch, patches[i]);
		patch.path = patches[i].path.split('/').slice(1);
		if (patch.op === 'add' || patch.op === 'replace')
			await add(patch, table);
		else if (patch.op === 'remove')
			await remove(patch, table);
	}

	async function add({path, value, op}, table, row, parentRow, relation) {
		let property = path[0];
		path = path.slice(1);
		if (!relation)
			row = row || await table.tryGetById(property);
		// if ((path.length === 0) && !relation) {

		// }
		if (path.length === 0) {
			let pkName = table._primaryColumns[0].alias;
			row = table.insert(property[pkName]);
			for(let name in value) {
				row[name] = value[name];
			}
			return;
		}
		property = path[0];
		if (isColumn(property, table)) {
			console.log('isColumn');
			dto = {};
			dto[property] = row[property];
			row[property] = applyPatchToColumn({}, dto, [{path: '/' + path.join('/'), op, value}]);
		}
		else if (isOneRelation(property, table)) {
			console.log('isOne');
			let relation = table[property]._relation;
			await add({path, value, op}, relation.childTable, await row[property], row, relation);
		}
		else if (isManyRelation(property, table)) {
			console.log('isMany');
			let children = (await row[property]).slice(0);
			for (let i = 0; i < children.length; i++) {
				let relation = table[property]._relation;
				await add({path, value, op}, relation.childTable, await row[property], row, relation);
			}
		}
	}

	async function remove({path, value, op}, table, row) {
		let property = path[0];
		path = path.slice(1);
		row = row || await table.getById(property);
		if (path.length === 0)
			return row.cascadeDelete();
		property = path[0];
		if (isColumn(property, table)) {
			let dto = {};
			dto[property] = row[property];
			let result  = applyPatchToColumn({}, dto, [{path: '/' + path.join('/'), op}]);
			row[property] = result[property];
		}
		else if (isOneRelation(property, table)) {
			let child = await row[property];
			if (!child)
				throw new Error(property + ' does not exist');
			await remove({path, value, op}, table[property], child);
		}
		else if (isManyRelation(property, table)) {
			let children = (await row[property]).slice(0);
			for (let i = 0; i < children.length; i++) {
				let child = children[i];
				await remove({path, value, op}, table[property], child);
			}
		}
	}

	function isColumn(name, table) {
		//only column have the equal function
		return table[name] && table[name].equal;
	}

	function isJoinRelation(name) {
		return !isHasRelation(name);
	}

	function isRelation(name, table) {
		return table[name] && table[name]._relation;
	}

	function isManyRelation(name) {
		return table[name] && table[name]._relation.isMany;
	}

	function isOneRelation(name) {
		return table[name] && table[name]._relation.isOne;
	}

	async function deleteChild({row, propertyName}) {
		return (await row[propertyName]).cascadeDelete();
	}

	function addChild({propertyName, value}) {
		let childTable = table[propertyName]._relation.childTable;
		let child = childTable.insert(value.id);
		for(let column in value) {
			child[column] = value[column];
		}
	}
}

module.exports = applyPatch;