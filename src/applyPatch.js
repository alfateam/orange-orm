let rfc = require('rfc6902');
let { inspect } = require('util');
let assert = require('assert');
let fromCompareObject = require('./fromCompareObject');

function applyPatch({ defaultConcurrency, concurrency }, dto, changes) {
	let dtoCompare = toCompareObject(dto);
	changes = validateConflict(dtoCompare, changes);
	rfc.applyPatch(dtoCompare, changes);

	let result = fromCompareObject(dtoCompare);

	if (Array.isArray(dto))
		dto.length = 0;
	else
		for (let name in dto) {
			delete dto[name];
		}

	for (let name in result) {
		dto[name] = result[name];
	}

	return dto;

	function validateConflict(object, changes) {
		return changes.filter(change => {
			let expectedOldValue = change.oldValue;
			let strategy = getStrategy(change.path);
			if ((strategy === 'optimistic') || (strategy === 'skipOnConflict')) {
				let oldValue = getOldValue(object, change.path);
				try {
					assert.deepEqual(oldValue, expectedOldValue);
				}
				catch (e) {
					if (strategy === 'skipOnConflict')
						return false;
					throw new Error(`The field ${change.path} was changed by another user. Expected ${inspect(fromCompareObject(expectedOldValue), false, 10)}, but was ${inspect(fromCompareObject(oldValue), false, 10)}.`);
				}
			}
			return true;
		});

		function getOldValue(obj, path) {
			let splitPath = path.split('/');
			splitPath.shift();
			return splitPath.reduce(extract, obj);

			function extract(obj, name) {
				if (obj === Object(obj))
					return obj[name];
				return;
			}
		}

	}

	function getStrategy(path) {
		let splitPath = path.split('/');
		splitPath.shift();
		return splitPath.reduce(extract, concurrency);

		function extract(obj, name) {
			if (Array.isArray(obj))
				return obj[0] || defaultConcurrency;
			if (obj === Object(obj))
				return obj[name] || defaultConcurrency;
			return obj;
		}
	}
}

function toCompareObject(object) {
	if (Array.isArray(object)) {
		let copy = {};
		Object.defineProperty(copy, '__patchType', {
			value: 'Array',
			writable: true,
			enumerable: true
		});

		for (var i = 0; i < object.length; i++) {
			let element = toCompareObject(object[i]);
			if (element === Object(element) && 'id' in element)
				copy[element.id] = element;
			else
				copy[i] = element;
		}
		return copy;
	} else if (object === Object(object)) {
		let copy = {};
		for (let name in object) {
			copy[name] = toCompareObject(object[name]);
		}
		return copy;
	}
	return object;
}

module.exports = applyPatch;