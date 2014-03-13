var newBoolean = require('../newBoolean');
var extractAlias = require('../extractAlias');
var operator = ' LIKE ';

function endsWith(column,arg,optionalAlias) {
	var alias = extractAlias(optionalAlias);
	arg =  arg + '%';
	var encoded = column.encode(arg);	
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);		
	return newBoolean(filter);
};

module.exports = endsWith;