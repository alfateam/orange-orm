var newParameterized = require('./newParameterized');
var extractAlias = require('./extractAlias');

function lessThanOrEqual(column,arg,optionalAlias) {	
	var operator = '<=';
	var alias = extractAlias(optionalAlias);	
	var encoded = column.convertThenEncode(arg);	
	var firstPart = alias + '.' + column.name + operator;
	return encoded.prepend(firstPart);		
};

module.exports = lessThanOrEqual;