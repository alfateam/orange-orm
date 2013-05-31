var newParameterized = require('./newParameterized');
var extractAlias = require('./extractAlias');
var nullOperator = ' is ';

function equal(column,arg,optionalAlias) {	
	var operator = '=';
	var alias = extractAlias(optionalAlias);	
	var encoded = column.convertThenEncode(arg);	
	if (encoded.sql() == 'null') 
		operator = nullOperator;
	var firstPart = alias + '.' + column.name + operator;
	return encoded.prepend(firstPart);		
};

module.exports = equal;