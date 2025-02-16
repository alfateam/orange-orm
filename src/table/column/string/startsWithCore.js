var newBoolean = require('../newBoolean');
var nullOperator = ' is ';
var quote = require('../../quote');

function startsWithCore(context, operator, column,arg,alias) {
	operator = ' ' + operator + ' ';
	var encoded = column.encode(context, arg);
	if (encoded.sql() == 'null')
		operator = nullOperator;
	else
		encoded = column.encode(context, arg + '%');
	var firstPart = quote(context, alias) + '.' + quote(context, column._dbName) + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean(filter);
}

module.exports = startsWithCore;