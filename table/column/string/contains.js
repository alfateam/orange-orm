var newBoolean = require('../newBoolean');
var extractAlias = require('../extractAlias');
var encode = require('./encodeCore');
var operator = ' LIKE \'%';

function contains(column,arg,optionalAlias) {
	var alias = extractAlias(optionalAlias);
	var encoded = encode(arg);	
	var firstPart = alias + '.' + column._dbName + operator;
	var filter = encoded.prepend(firstPart).append('%\'');		
	return newBoolean(filter);
};

module.exports = contains;