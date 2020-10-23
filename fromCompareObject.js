function fromCompareObject(object) {
	if (object === null || object === undefined) return object;
	if (object.__patchType === 'Array') {
		let copy = [];
		let i = 0;
		for (let id in object) {
			copy[i] = fromCompareObject(object[id]);
			i++;
		}
		return copy;
	} else if (object === Object(object)) {
		let copy = {};
		for (let name in object) {
			copy[name] = fromCompareObject(object[name]);
		}
		return copy;
	}
	return object;
}

module.exports = fromCompareObject;