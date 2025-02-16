var newBoolean = require('./newBoolean');
var nullOperator = ' is ';
var encodeFilterArg = require('./encodeFilterArg');
var quote = require('../quote');

function equal(context, column,arg,alias) {
	var operator = '=';
	var encoded = encodeFilterArg(context, column, arg);
	if (encoded.sql() == 'null')
		operator = nullOperator;
	var firstPart = quote(context, alias) + '.' + quote(context, column._dbName) + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean(filter);
}

module.exports = equal;