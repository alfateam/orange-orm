var newParameterized = require('../query/newParameterized');
var extractAlias = require('./extractAlias');
var operator = ' LIKE ';

function endsWith(column,arg,optionalAlias) {
	var alias = extractAlias(optionalAlias);
	arg =  '%' + arg;
	var encoded = column.encode(arg);	
	var firstPart = alias + '.' + column.name + operator;
	return encoded.prepend(firstPart);		
};

module.exports = endsWith;