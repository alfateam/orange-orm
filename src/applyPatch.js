const fastjson = require('fast-json-patch');
let fromCompareObject = require('./fromCompareObject');
let toCompareObject = require('./toCompareObject');
let getSessionSingleton = require('./table/getSessionSingleton');

function applyPatch({ options = {}, context }, dto, changes, column) {
	let dtoCompare = toCompareObject(dto);
	changes = validateReadonly(dtoCompare, changes);
	if (column.tsType === 'JSONColumn') {
		const engine = context ? getSessionSingleton(context, 'engine') : undefined;
		if(column && engine === 'sap') {
			changes = validateConflict(dtoCompare, changes);
			fastjson.applyPatch(dtoCompare, changes, true, true);
		}
	}
	else
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

	function validateReadonly(object, changes) {
		return changes.filter(change => {
			const option = getOption(change.path);
			let readonly = option.readonly;
			if (readonly) {
				const e = new Error(`Cannot update column ${change.path.replace('/', '')} because it is readonly`);
				// @ts-ignore
				e.status = 405;
				throw e;
			}
			return true;
		});
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



	function validateConflict(object, changes) {
		return changes.filter(change => {
			let expectedOldValue = change.oldValue;
			const option = getOption(change.path);
			let readonly = option.readonly;
			if (readonly) {
				const e = new Error(`Cannot update column ${change.path.replace('/', '')} because it is readonly`);
				// @ts-ignore
				e.status = 405;
				throw e;
			}
			let concurrency = option.concurrency || 'optimistic';
			if ((concurrency === 'optimistic') || (concurrency === 'skipOnConflict')) {
				let oldValue = getOldValue(object, change.path);
				try {
					// if (column?.tsType === 'DateColumn') {
					// 	assertDatesEqual(oldValue, expectedOldValue);
					// }
					// else
					assertDeepEqual(oldValue, expectedOldValue);
				}
				catch (e) {
					if (concurrency === 'skipOnConflict')
						return false;
					throw new Error('The row was changed by another user.');
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

}

function assertDeepEqual(a, b) {
	if (!deepEqual(a, b))
		throw new Error('A, b are not equal');
}

function deepEqual(a, b) {
	if (a === b) return true;
	if (a && b && typeof a === 'object' && typeof b === 'object') {
		if (Array.isArray(a)) {
			if (!Array.isArray(b) || a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (!deepEqual(a[i], b[i])) return false;
			}
			return true;
		}
		if (Array.isArray(b)) return false;

		const keysA = Object.keys(a);
		const keysB = Object.keys(b);
		if (keysA.length !== keysB.length) return false;
		for (const key of keysA) {
			if (!Object.prototype.hasOwnProperty.call(b, key) || !deepEqual(a[key], b[key])) return false;
		}
		return true;
	}
	return false;
}

module.exports = applyPatch;