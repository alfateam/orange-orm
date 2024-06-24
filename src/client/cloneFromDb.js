let dateToISOString = require('../dateToISOString');

function cloneFromDbFast(obj) {
	if (obj === null || typeof obj !== 'object')
		return obj;
	if (Array.isArray(obj)) {
		const arrClone = [];
		for (let i = 0; i < obj.length; i++) {
			arrClone[i] = cloneFromDbFast(obj[i]);
		}
		return arrClone;
	}
	const clone = {};
	const keys = Object.keys(obj);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		clone[key] = cloneFromDbFast(obj[key]);
	}
	return clone;
}

function cloneRegular(obj) {
	if (obj === null || typeof obj !== 'object')
		return obj;
	if (Array.isArray(obj)) {
		const arrClone = [];
		for (let i = 0; i < obj.length; i++) {
			arrClone[i] = cloneRegular(obj[i]);
		}
		return arrClone;
	}
	else if (obj instanceof Date  && !isNaN(obj))
		return dateToISOString(obj);
	const clone = {};
	const keys = Object.keys(obj);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		clone[key] = cloneRegular(obj[key]);
	}
	return clone;
}

function cloneFromDb(obj, isFast) {
	if (isFast)
		return cloneFromDbFast(obj);
	else
		return cloneRegular(obj);
}

module.exports = cloneFromDb;