const dateToISOString = require('./dateToISOString');

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
	}

	if (Buffer.isBuffer(object))
		return object.toString('base64');
	// @ts-ignore
	else if (object instanceof Date && !isNaN(object))
		return dateToISOString(object);
	else if (object === Object(object)) {
		let copy = {};
		for (let name in object) {
			copy[name] = toCompareObject(object[name]);
		}
		return copy;
	}
	return object;
}

module.exports = toCompareObject;