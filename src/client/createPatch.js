const jsonpatch = require('fast-json-patch');
let dateToIsoString = require('../dateToISOString');
let stringify = require('./stringify');
let { v4: uuid } = require('uuid');

module.exports = function createPatch(original, dto, options) {
	let subject = toCompareObject({ d: original }, options, true);
	let clonedDto = toCompareObject({ d: dto }, options, true);
	let keyPositionMap = toKeyPositionMap(dto);
	let observer = jsonpatch.observe(subject);
	subject.d = clonedDto.d;
	let changes = jsonpatch.generate(observer);
	let clonedOriginal = toCompareObject(original, options);
	let {inserted, deleted, updated}  = splitChanges(changes);
	updated.sort(comparePatch);
	return [...inserted, ...updated, ...deleted];

	function splitChanges(changes) {
		let inserted = [];
		let deleted = [];
		let updated = [];
		for (let change of changes) {
			change.path = change.path.substring(2);
			if (change.op === 'add' && change.path.split('/').length === 2) {
				inserted.push(change);
			}
			else if (change.op === 'remove' && change.path.split('/').length === 2) {
				addOldValue(change);
				deleted.push(change);
			} else {
				addOldValue(change);
				updated.push(change);
			}
		}
		return { inserted, updated, deleted};
	}

	function addOldValue(change) {
		if (change.op === 'remove' || change.op === 'replace') {
			let splitPath = change.path.split('/');
			splitPath.shift();
			change.oldValue = splitPath.reduce(extract, clonedOriginal);
		}
		else
			return change;

		function extract(obj, element) {
			return obj[element];
		}

		return change;
	}

	function toKeyPositionMap(rows) {
		return rows.reduce((map, element, i) => {
			if (options && options.keys && element === Object(element)) {
				let key = [];
				for (let i = 0; i < options.keys.length; i++) {
					let keyName = options.keys[i].name;
					key.push(negotiateTempKey(element[keyName]));
				}
				map[stringify(key)] = i;
			}
			else if ('id' in element)
				map[stringify(element.id)] = i;
			else
				map[i] = i;
			return map;
		}, {});

	}

	function toCompareObject(object, options, isRoot) {
		if (Array.isArray(object)) {
			let copy = { __patchType: 'Array' };
			for (let i = 0; i < object.length; i++) {
				let element = toCompareObject(object[i], options);
				if (options && options.keys && element === Object(element)) {
					let key = [];
					for (let i = 0; i < options.keys.length; i++) {
						let keyName = options.keys[i].name;
						key.push(negotiateTempKey(element[keyName]));
					}
					copy[stringify(key)] = element;
				}
				else if (element === Object(element) && 'id' in element)
					copy[stringify(element.id)] = element;
				else
					copy[i] = element;
			}
			return copy;
		}
		else if (isValidDate(object))
			return dateToIsoString(object);
		else if (object === Object(object)) {
			let copy = {};
			for (let name in object) {
				copy[name] = toCompareObject(object[name], isRoot ? options : options && options.relations && options.relations[name]);
			}
			return copy;
		}
		return object;
	}

	function isValidDate(d) {
		return d instanceof Date && !isNaN(d);
	}

	function negotiateTempKey(value) {
		if (value === undefined)
			return `~${uuid()}`;
		else
			return value;
	}

	function comparePatch(a, b) {
		const aPathArray = a.path.split('/');
		const bPathArray = b.path.split('/');
		return (aPathArray.length - bPathArray.length) || (keyPositionMap[aPathArray[1]] ?? Infinity - keyPositionMap[bPathArray[1]] ?? Infinity) || a.path.localeCompare(b.path);
	}

};
