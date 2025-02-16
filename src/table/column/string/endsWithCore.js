const quote = require('../../quote');
var newBoolean = require('../newBoolean');
var nullOperator = ' is ';

function endsWithCore(context, operator, column,arg,alias) {
	alias = quote(alias);
	operator = ' ' + operator + ' ';
	var encoded = column.encode(context, arg);
	if (encoded.sql() == 'null')
		operator = nullOperator;
	else
		encoded = column.encode(context, '%' + arg);
	var firstPart = alias + '.' + quote(context, column._dbName) + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean(filter);
}

module.exports = endsWithCore;