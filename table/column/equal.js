var newBoolean = require('./newBoolean');
var nullOperator = ' is ';
var encodeFilterArg = require('./encodeFilterArg');

function equal(column,arg,alias) {	
	var operator = '=';
	var encoded = encodeFilterArg(column, arg);
	if (encoded.sql() == 'null') 
		operator = nullOperator;
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);		
	return newBoolean(filter);
}

module.exports = equal;