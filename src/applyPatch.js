const fastjson = require('fast-json-patch');
let { inspect } = require('util');
let assert = require('assert');
let fromCompareObject = require('./fromCompareObject');
let toCompareObject = require('./toCompareObject');

function applyPatch({ options = {} }, dto, changes, column) {
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
			const option = getOption(change.path);
			let readonly = option.readonly;
			if (readonly) {
				const e = new Error(`Cannot update column ${change.path.replace('/','')} because it is readonly`);
				// @ts-ignore
				e.status = 405;
				throw e;
			}
			let concurrency = option.concurrency || 'optimistic';
			if ((concurrency === 'optimistic') || (concurrency === 'skipOnConflict')) {
				let oldValue = getOldValue(object, change.path);
				try {
					if (column?.tsType === 'DateColumn') {
						assertDatesEqual(oldValue, expectedOldValue);
					}
					else
						assert.deepEqual(oldValue, expectedOldValue);
				}
				catch (e) {
					if (concurrency === 'skipOnConflict')
						return false;
					throw new Error(`The field ${change.path.replace('/','')} was changed by another user. Expected ${inspect(fromCompareObject(expectedOldValue), false, 10)}, but was ${inspect(fromCompareObject(oldValue), false, 10)}.`);
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
				return obj[0] || options;
			if (obj === Object(obj))
				return obj[name] || options;
			return obj;
		}

	}
}

function assertDatesEqual(date1, date2) {
	if (date1 && date2 ) {
		date1 = new Date(date1);
		date2 = new Date(date2);
		assert.deepEqual(date1.getTime(), date2.getTime());
	}
	else
		assert.deepEqual(date1, date2);
}

module.exports = applyPatch;