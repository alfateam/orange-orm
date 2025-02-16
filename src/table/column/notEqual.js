var newBoolean = require('./newBoolean');
var encodeFilterArg = require('./encodeFilterArg');
var nullOperator = ' is not ';
var quote = require('../quote');

function notEqual(context, column,arg,alias) {
	var operator = '<>';
	var encoded = encodeFilterArg(context, column, arg);
	if (encoded.sql() == 'null')
		operator = nullOperator;
	var firstPart = quote(context, alias) + '.' + quote(context, column._dbName) + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean(filter);
}

module.exports = notEqual;