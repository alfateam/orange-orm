var newBoolean = require('./newBoolean');
var encodeFilterArg = require('./encodeFilterArg');
var quote = require('../quote');

function greaterThanOrEqual(context, column,arg,alias) {
	var operator = '>=';
	var encoded = encodeFilterArg(context, column, arg);
	var firstPart = quote(context, alias) + '.' + quote(context, column._dbName) + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean(filter);
}

module.exports = greaterThanOrEqual;