function cloneRows(obj) {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}
	if (Array.isArray(obj)) {
		const arrClone = [];
		for (let i = 0; i < obj.length; i++) {
			arrClone[i] = cloneRows(obj[i]);
		}
		return arrClone;
	}
	const clone = {};
	const keys = Object.keys(obj);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		clone[key] = cloneRows(obj[key]);
	}
	return clone;
}


module.exports = cloneRows;