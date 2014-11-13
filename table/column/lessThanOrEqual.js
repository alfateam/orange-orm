var newBoolean = require('./newBoolean');
var extractAlias = require('./extractAlias');

function lessThanOrEqual(column,arg,optionalAlias) {	
	var operator = '<=';
	var alias = extractAlias(optionalAlias);	
	var encoded = column.encode(arg);	
	var firstPart = alias + '.' + column._dbName + operator;
	var filter = encoded.prepend(firstPart);		
	return newBoolean(filter);
}

module.exports = lessThanOrEqual;