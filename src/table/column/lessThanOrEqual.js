var newBoolean = require('./newBoolean');
var encodeFilterArg = require('./encodeFilterArg');
const getSessionSingleton = require('../getSessionSingleton');

function lessThanOrEqual(context, column,arg,alias) {
	const quote = getSessionSingleton(context, 'quote');
	var operator = '<=';
	var encoded = encodeFilterArg(context, column, arg);
	var firstPart = quote(context, alias) + '.' + quote(context, column._dbName) + operator;
	var filter = encoded.prepend(firstPart);
	return newBoolean(filter);
}

module.exports = lessThanOrEqual;