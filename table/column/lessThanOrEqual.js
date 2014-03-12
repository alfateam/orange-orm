var newParameterized = require('../query/newParameterized');
var extractAlias = require('./extractAlias');

function lessThanOrEqual(column,arg,optionalAlias) {	
	var operator = '<=';
	var alias = extractAlias(optionalAlias);	
	var encoded = column.encode(arg);	
	var firstPart = alias + '.' + column._dbName + operator;
	return encoded.prepend(firstPart);		
};

module.exports = lessThanOrEqual;