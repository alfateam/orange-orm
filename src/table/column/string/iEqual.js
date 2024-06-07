var newBoolean = require('../newBoolean');
var nullOperator = ' is ';
var encodeFilterArg = require('../encodeFilterArg');
const quote = require('../../quote');

function iEqual(column,arg,alias) {
	var operator = ' ILIKE ';
	var encoded = encodeFilterArg(column, arg);
	if (encoded.sql() == 'null')
		operator = nullOperator;
	var firstPart = alias + '.' + quote(column._dbName) + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean(filter);
}

module.exports = iEqual;