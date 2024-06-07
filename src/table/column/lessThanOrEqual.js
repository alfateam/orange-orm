var newBoolean = require('./newBoolean');
var encodeFilterArg = require('./encodeFilterArg');
const getSessionSingleton = require('../getSessionSingleton');

function lessThanOrEqual(column,arg,alias) {
	const quote = getSessionSingleton('quote');
	var operator = '<=';
	var encoded = encodeFilterArg(column, arg);
	var firstPart = quote(alias) + '.' + quote(column._dbName) + operator;
	var filter = encoded.prepend(firstPart);
	return newBoolean(filter);
}

module.exports = lessThanOrEqual;