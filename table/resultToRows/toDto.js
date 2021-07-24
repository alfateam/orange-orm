let resultToPromise = require('../resultToPromise');
let createDto = require('./toDto/createDto');

function toDto(strategy, table, row, joinRelationSet) {
	if (joinRelationSet)
		return toDtoSync(table, row, joinRelationSet);
	let dto = createDto(table, row);
	strategy = strategy || {};
	let promise = resultToPromise(dto);

	for (let property in strategy) {
		mapChild(property);
	}

	function mapChild(name) {
		promise = promise.then(getRelated).then(onChild);

		function getRelated() {
			return row[name];
		}

		function onChild(child) {
			if (child)
				return child.__toDto(strategy[name]).then(onChildDto);
		}

		function onChildDto(childDto) {
			dto[name] = childDto;
		}
	}

	return promise.then(function() {
		return dto;
	});
}

function toDtoSync(table, row, joinRelationSet) {
	if (!row)
		return;
	let dto = createDto(table, row);
	for(let name in table._relations) {
		let relation = table._relations[name];
		let join = relation.joinRelation || relation;
		if (!row.isExpanded(name) || joinRelationSet.has(join))
			continue;
		let child = relation.getRowsSync(row);
		if (!child)
			dto[name] = child;
		else if (Array.isArray(child)) {
			dto[name] = [];
			for (let i = 0; i < child.length; i++) {
				dto[name].push(toDtoSync(relation.childTable, child[i], new Set([...joinRelationSet, join])));
			}
		}
		else
			dto[name] = toDtoSync(relation.childTable, child, new Set([...joinRelationSet, join]));
	}
	return dto;
}

module.exports = toDto;
