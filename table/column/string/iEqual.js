var newBoolean = require('../newBoolean');
var extractAlias = require('../extractAlias');
var encode = require('./encodeCore');
var equal = require('../equal')

function iEqual(column,arg,optionalAlias) {
	var encoded = encode(arg);		
	if (encoded.sql() === 'null')
		return equal(column, arg, optionalAlias);
	var alias = extractAlias(optionalAlias);	
	var firstPart = alias + '.' + column._dbName + ' ILIKE \'';
	var filter =  encoded.prepend(firstPart).append('\'');	
	return newBoolean(filter);
}

module.exports = iEqual;