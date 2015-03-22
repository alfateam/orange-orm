var newBoolean = require('../newBoolean');
var extractAlias = require('../extractAlias');
var nullOperator = ' is ';

function endsWithCore(operator, column,arg,optionalAlias) {	
	operator = ' ' + operator + ' ';
	var alias = extractAlias(optionalAlias);	
	var encoded = column.encode(arg);
	if (encoded.sql() == 'null') 
		operator = nullOperator;
	else
		encoded = column.encode('%' + arg + '%');
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);		
	return newBoolean(filter);
}

module.exports = endsWithCore;