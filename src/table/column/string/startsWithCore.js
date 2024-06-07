var newBoolean = require('../newBoolean');
var nullOperator = ' is ';
var quote = require('../../quote');

function startsWithCore(operator, column,arg,alias) {
	operator = ' ' + operator + ' ';
	var encoded = column.encode(arg);
	if (encoded.sql() == 'null')
		operator = nullOperator;
	else
		encoded = column.encode(arg + '%');
	var firstPart = quote(alias) + '.' + quote(column._dbName) + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean(filter);
}

module.exports = startsWithCore;