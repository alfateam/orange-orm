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


	async function add({path, value, op}, table, row, parentRow) {
		let property = path[0];
		path = path.slice(1);
		row = row || await table.getById(property);
		if (path.length === 0)
			return;//insert
			// return row.cascadeDelete();
		property = path[0];
		console.log(property);
		if (isColumn(property, table)) {
			dto = {};
			dto[property] = row[property];
			row[property] = applyPatchToColumn({}, dto, [{path: '/' + path.join('/'), op, value}]);
		}
		else if (isOneRelation(property, table)) {
			let child = await row[property];
			if (!child)
				throw new Error(property + ' does not exist');
			await add({path, value, op}, table[property], child);
		}
		else if (isManyRelation(property, table)) {
			let children = (await row[property]).slice(0);
			for (let i = 0; i < children.length; i++) {
				let child = children[i];
				await add({path, value, op}, table[property], child);
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