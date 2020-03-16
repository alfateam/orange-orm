let rfc = require('rfc6902');

function applyPatch(options = {}, dto, changes) {
	const hasSchema = options.schema;
	let dtoCompare = toCompareObject(dto);
	validateConflict(dtoCompare, changes);
	rfc.applyPatch(dtoCompare, changes);
	let result = fromCompareObject(dtoCompare, options.schema, dto);

	if(Array.isArray(dto))
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
		for (let i = 0; i < changes.length; i++) {
			let change = changes[i];
			let expectedOldValue = change.oldValue;
			if (! isConcurrent(change.path))
				continue;
			let oldValue = getOldValue(object, change.path);
			if (oldValue !== expectedOldValue)
				throw new Error(`The field ${change.path} was changed by another user. Expected ${expectedOldValue}, but was ${oldValue}.`);
		}

		function getOldValue(obj, path) {
			function extract(obj, element) {
				if (obj === Object(obj))
					return obj[element];
				return;
			}
			let splitPath = path.split('/');
			splitPath.shift();
			return splitPath.reduce(extract, obj);
		}

	}

	function isConcurrent(path) {
		let splitPath = path.split('/');
		splitPath.shift();
		return splitPath.reduce(extract, options.concurrency);

		function extract(obj, element) {
			if (Array.isArray(obj))
				return obj[0];
			if (obj === Object(obj))
				return obj[element];
			return;
		}
	}

	function fromCompareObject(object, schema = {}, dto = {}) {
		if (Array.isArray(schema) || Array.isArray(dto)) {
			let copy = [];
			let i = 0;
			for (let id in object) {
				copy[i] = fromCompareObject(object[id], schema[0], dto[id]);
				i++;
			}
			return copy;
		} else if (object === Object(object)) {
			let copy = {};
			for (let name in object) {
				if (name in schema || !hasSchema)
					copy[name] = fromCompareObject(object[name], schema[name], dto[name]);
			}
			return copy;
		}
		return object;
	}

}

function toCompareObject(object) {
	if (Array.isArray(object)) {
		let copy = {};
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