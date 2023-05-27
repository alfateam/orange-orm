const fastjson = require('fast-json-patch');
let { inspect } = require('util');
let assert = require('assert');
let fromCompareObject = require('./fromCompareObject');
let toCompareObject = require('./toCompareObject');

function applyPatch({ defaultConcurrency, concurrency, options = {}, defaults = {} }, dto, changes) {
	let dtoCompare = toCompareObject(dto);
	changes = validateConflict(dtoCompare, changes);
	fastjson.applyPatch(dtoCompare, changes, true, true);

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
			let readonly = getOption(change.path).readonly;
			if (readonly) {
				const e = new Error(`Cannot update column ${change.path.replace('/','')} because it is readonly`);
				// @ts-ignore
				e.status = 405;
				throw e;
			}
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

	function getOption(path) {
		let splitPath = path.split('/');
		splitPath.shift();
		return splitPath.reduce(extract, options);

		function extract(obj, name) {
			if (Array.isArray(obj))
				return obj[0] || defaults;
			if (obj === Object(obj))
				return obj[name] || defaults;
			return obj.readonly;
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

module.exports = applyPatch;