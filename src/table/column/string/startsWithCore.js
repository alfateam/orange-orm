var newBoolean = require('../newBoolean');
var nullOperator = ' is ';

function startsWithCore(operator, column,arg,alias) {
	operator = ' ' + operator + ' ';
	var encoded = column.encode(arg);
	if (encoded.sql() == 'null')
		operator = nullOperator;
	else
		encoded = column.encode(arg + '%');
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean(filter);
}

module.exports = startsWithCore;