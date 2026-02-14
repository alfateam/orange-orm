var newBoolean = require('../newBoolean');
var nullOperator = ' is ';
var quote = require('../../quote');
var encodeFilterArg = require('../encodeFilterArg');
var newLikeColumnArg = require('./newLikeColumnArg');

function startsWithCore(context, operator, column,arg,alias) {
	operator = ' ' + operator + ' ';
	var encoded = encodeFilterArg(context, column, arg);
	if (encoded.sql() == 'null')
		operator = nullOperator;
	else if (arg && typeof arg._toFilterArg === 'function')
		encoded = newLikeColumnArg(context, column, encoded, null, '%');
	else
		encoded = column.encode(context, arg + '%');
	var firstPart = quote(context, alias) + '.' + quote(context, column._dbName) + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean(filter);
}

module.exports = startsWithCore;
