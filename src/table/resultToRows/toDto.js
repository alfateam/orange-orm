let flags = require('../../flags');
let tryGetSessionContext = require('../tryGetSessionContext');

function toDto(strategy, table, row, joinRelationSet) {
	let result;
	flags.useProxy = false;
	let context = tryGetSessionContext();
	let ignoreSerializable = context && 'ignoreSerializable';
	if (joinRelationSet) {
		result = toDtoSync(table, row, joinRelationSet, strategy, ignoreSerializable);
	}
	else
		result =  _toDto(table, row, strategy, ignoreSerializable);
	flags.useProxy = true;
	return result;
}

async function _toDto(table, row, strategy, ignoreSerializable) {
	let dto = {};
	if (!row)
		return;
	for (let name in strategy) {
		if (!strategy[name])
			continue;
		let column = table[name];
		// eslint-disable-next-line no-prototype-builtins
		if (table._aliases.has(name) && (ignoreSerializable || !('serializable' in column && !column.serializable) && row.propertyIsEnumerable(name))) {
			if (column.toDto)
				dto[name] = column.toDto(row[name]);
			else
				dto[name] = row[name];
		}
		else if (table._relations[name] && strategy[name]) {
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
					dto[name].push(await _toDto(relation.childTable, child[i], strategy && strategy[name], ignoreSerializable));
				}
			}
			else
				dto[name] = await _toDto(relation.childTable, child, strategy && strategy[name], ignoreSerializable);
		}
	}
	return dto;
}


function toDtoSync(table, row, joinRelationSet, strategy, ignoreSerializable) {
	let dto = {};
	if (!row)
		return;
	for (let name in row) {
		let column = table[name];
		if (table._aliases.has(name) && (ignoreSerializable || !('serializable' in column && !column.serializable))) {
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
					dto[name].push(toDtoSync(relation.childTable, child[i], new Set([...joinRelationSet, join]), strategy && strategy[name], ignoreSerializable));
				}
			}
			else
				dto[name] = toDtoSync(relation.childTable, child, new Set([...joinRelationSet, join]), strategy && strategy[name], ignoreSerializable);

		}
	}
	return dto;
}

module.exports = toDto;
