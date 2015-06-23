var newBoolean = require('../newBoolean');
var encode = require('./encodeCore');
var equal = require('../equal')

function iEqual(column,arg,alias) {
	var encoded = encode(arg);		
	if (encoded.sql() === 'null')
		return equal(column, arg, alias);
	var firstPart = alias + '.' + column._dbName + ' ILIKE \'';
	var filter =  encoded.prepend(firstPart).append('\'');	
	return newBoolean(filter);
}

module.exports = iEqual;