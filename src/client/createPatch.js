let rfc = require('rfc6902');
let dateToIsoString = require('../dateToIsoString');
let stringify = require('./stringify');
let {v4: uuid} = require('uuid');

module.exports = function createPatch(original, dto, options) {
	let clonedOriginal = toCompareObject(original, options);
	let clonedDto = toCompareObject(dto, options);
	let changes = rfc.createPatch(clonedOriginal, clonedDto);
	changes = changes.map(addOldValue);
	return changes;

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

	function toCompareObject(object, options) {
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
				copy[name] = toCompareObject(object[name], options && options.relations && options.relations[name]);
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

};
