var newParameterized = require('../query/newParameterized');
var extractAlias = require('./extractAlias');

function greaterThanOrEqual(column,arg,optionalAlias) {	
	var operator = '>=';
	var alias = extractAlias(optionalAlias);	
	var encoded = column.purifyThenEncode(arg);	
	var firstPart = alias + '.' + column.name + operator;
	return encoded.prepend(firstPart);		
};

module.exports = greaterThanOrEqual;