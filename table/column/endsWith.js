var newParameterized = require('./newParameterized');
var extractAlias = require('./extractAlias');
var operator = ' LIKE ';

function endsWith(column,arg,optionalAlias) {
	var alias = extractAlias(optionalAlias);
	arg =  '%' + arg;
	var encoded = column.convertThenEncode(arg);	
	var firstPart = alias + '.' + column.name + operator;
	return encoded.prepend(firstPart);		
};

module.exports = endsWith;