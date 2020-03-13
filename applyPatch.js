let applyPatchToColumn = require('./applyPatchToColumn');

async function applyPatch(table, patch) {
	for (let i = 0; i < patch.length; i++) {
		await applySingle(patch[i]);
	}

	async function applySingle({path, value, op}) {
		let splitPath = path.split('/').slice(1);
		let id = splitPath.shift();
		let row = await table.getById(id);
		if (splitPath.length === 1) {
			let propertyName = splitPath[0];
			if (isColumn(propertyName))
				return row[propertyName] = value;
			if (isHasRelation(propertyName)) {
				if (op === 'remove')
					await deleteChild({row, propertyName});
				else
					addChild({propertyName, value});
			}
		}
		let propertyName = splitPath.shift();
		let options = {};
		let result  = applyPatchToColumn(options, row[propertyName], [{path: '/' + splitPath.join('/'), op, value}]);
		row[propertyName] = result;
	}

	function isColumn(name) {
		//only column have the equal function
		return table[name] && table[name].equal;
	}

	function isJoinRelation(name) {
		return !isHasRelation(name);
	}

	function isHasRelation(name) {
		return table[name] && table[name]._relation.joinRelation;
	}

	async function deleteChild({row, propertyName}) {
		return (await row[propertyName]).cascadeDelete();
	}

	function addChild({propertyName, value}) {
		console.log(propertyName);
		let childTable = table[propertyName]._relation.childTable;
		let child = childTable.insert(value.id);
		for(let column in value) {
			child[column] = value[column];
		}
	}
}

module.exports = applyPatch;