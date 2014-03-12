var newBoolean = require('./newBoolean');
var extractAlias = require('./extractAlias');
var nullOperator = ' is ';

function equal(column,arg,optionalAlias) {	
	var operator = '=';
	var alias = extractAlias(optionalAlias);	
	var encoded = column.encode(arg);	
	if (encoded.sql() == 'null') 
		operator = nullOperator;
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);		
	return newBoolean(filter);
};

module.exports = equal;