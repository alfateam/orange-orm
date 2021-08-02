let flags = require('../../flags');

function toDto(strategy, table, row, joinRelationSet) {
	let result;
	flags.useProxy = false;
	if (joinRelationSet) {
		result = toDtoSync(table, row, joinRelationSet, strategy);
	}
	else
		result =  _toDto(table, row, strategy);
	flags.useProxy = true;
	return result;
}

async function _toDto(table, row, strategy) {
	let dto = {};
	if (!row)
		return;
	for (let name in strategy) {
		let column = table[name];
		if (table._aliases.has(name) && !('serializable' in column && !column.serializable)) {
			if (column.toDto)
				dto[name] = column.toDto(row[name]);
			else
				dto[name] = row[name];
		}
		else if (table._relations[name] && strategy[name]) {
			console.log(name);
			let child;
			let relation = table._relations[name];
			if ((strategy && !(strategy[name] || strategy[name] === null)))
				continue;
			else if (!row.isExpanded(name))
				child = await row[name];
			else
				child = relation.getRowsSync(row);
			if (!child)
				dto[name] = child;
			else if (Array.isArray(child)) {
				dto[name] = [];
				for (let i = 0; i < child.length; i++) {
					dto[name].push(await _toDto(relation.childTable, child[i], strategy && strategy[name]));
				}
			}
			else
				dto[name] = await _toDto(relation.childTable, child, strategy && strategy[name]);
		}
	}
	return dto;
}


function toDtoSync(table, row, joinRelationSet, strategy) {
	let dto = {};
	if (!row)
		return;
	for (let name in row) {
		let column = table[name];
		if (table._aliases.has(name) && !('serializable' in column && !column.serializable)) {
			if (column.toDto)
				dto[name] = column.toDto(row[name]);
			else
				dto[name] = row[name];
		}
		else if (table._relations[name]) {
			let relation = table._relations[name];
			let join = relation.joinRelation || relation;
			if (!row.isExpanded(name) || joinRelationSet.has(join) || (strategy && !(strategy[name] || strategy[name] === null)))
				continue;
			let child = relation.getRowsSync(row);
			if (!child)
				dto[name] = child;
			else if (Array.isArray(child)) {
				dto[name] = [];
				for (let i = 0; i < child.length; i++) {
					dto[name].push(toDtoSync(relation.childTable, child[i], new Set([...joinRelationSet, join]), strategy && strategy[name]));
				}
			}
			else
				dto[name] = toDtoSync(relation.childTable, child, new Set([...joinRelationSet, join]), strategy && strategy[name]);

		}
	}
	return dto;
}

module.exports = toDto;
