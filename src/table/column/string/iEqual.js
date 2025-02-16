var newBoolean = require('../newBoolean');
var nullOperator = ' is ';
var encodeFilterArg = require('../encodeFilterArg');
const quote = require('../../quote');

function iEqual(context, column,arg,alias) {
	var operator = ' ILIKE ';
	var encoded = encodeFilterArg(context, column, arg);
	if (encoded.sql() == 'null')
		operator = nullOperator;
	var firstPart = alias + '.' + quote(context, column._dbName) + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean(filter);
}

module.exports = iEqual;