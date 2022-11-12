let isStringifying = false;
let dateToIsoString = require('../dateToIsoString');

let dateToJSON = Date.prototype.toJSON;
Date.prototype.toJSON = function() {
	if (isStringifying)
		return dateToIsoString(this);
	return dateToJSON.apply(this);
};

function stringify(value) {
	isStringifying = true;
	let result = JSON.stringify(value);
	isStringifying = false;
	return result;
}

module.exports = stringify;