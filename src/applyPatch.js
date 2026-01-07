const fastjson = require('fast-json-patch');
let fromCompareObject = require('./fromCompareObject');
let toCompareObject = require('./toCompareObject');

// todo
function applyPatch({ _options = {} }, dto, changes, _column) {
	let dtoCompare = toCompareObject(dto);
	// changes = validateConflict(dtoCompare, changes);
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

	// function validateConflict(object, changes) {
	// 	return changes.filter(change => {
	// 		let expectedOldValue = change.oldValue;
	// 		const option = getOption(change.path);
	// 		let readonly = option.readonly;
	// 		if (readonly) {
	// 			const e = new Error(`Cannot update column ${change.path.replace('/', '')} because it is readonly`);
	// 			// @ts-ignore
	// 			e.status = 405;
	// 			throw e;
	// 		}
	// 		let concurrency = option.concurrency || 'optimistic';
	// 		if ((concurrency === 'optimistic') || (concurrency === 'skipOnConflict')) {
	// 			let oldValue = getOldValue(object, change.path);
	// 			try {
	// 				if (column?.tsType === 'DateColumn') {
	// 					assertDatesEqual(oldValue, expectedOldValue);
	// 				}
	// 				else
	// 					assertDeepEqual(oldValue, expectedOldValue);
	// 			}
	// 			catch (e) {
	// 				if (concurrency === 'skipOnConflict')
	// 					return false;
	// 				throw new Error(`The field ${change.path.replace('/', '')} was changed by another user,,,. Expected ${inspect(fromCompareObject(expectedOldValue))}, but was ${inspect(fromCompareObject(oldValue))}.`);
	// 			}
	// 		}
	// 		return true;
	// 	});

	// 	function getOldValue(obj, path) {
	// 		let splitPath = path.split('/');
	// 		splitPath.shift();
	// 		return splitPath.reduce(extract, obj);

	// 		function extract(obj, name) {
	// 			if (obj === Object(obj))
	// 				return obj[name];
	// 			return;
	// 		}
	// 	}

	// }

	// function getOption(path) {
	// 	let splitPath = path.split('/');
	// 	splitPath.shift();
	// 	return splitPath.reduce(extract, options);

	// 	function extract(obj, name) {
	// 		if (Array.isArray(obj))
	// 			return obj[0] || options;
	// 		if (obj === Object(obj))
	// 			return obj[name] || options;
	// 		return obj;
	// 	}

	// }
}

// function assertDatesEqual(date1, date2) {
// 	if (date1 && date2) {
// 		const parts1 = date1.split('T');
// 		const time1parts = (parts1[1] || '').split(/[-+.]/);
// 		const parts2 = date2.split('T');
// 		const time2parts = (parts2[1] || '').split(/[-+.]/);
// 		while (time1parts.length !== time2parts.length) {
// 			if (time1parts.length > time2parts.length)
// 				time1parts.pop();
// 			else if (time1parts.length < time2parts.length)
// 				time2parts.pop();
// 		}
// 		date1 = `${parts1[0]}T${time1parts[0]}`;
// 		date2 = `${parts2[0]}T${time2parts[0]}`;
// 	}
// 	assertDeepEqual(date1, date2);
// }

// function assertDeepEqual(a, b) {
// 	if (JSON.stringify(a) !== JSON.stringify(b))
// 		throw new Error('A, b are not equal');
// }

// function inspect(obj) {
// 	return JSON.stringify(obj, null, 2);
// }

module.exports = applyPatch;