var newBoolean = require('./newBoolean');
var encodeFilterArg = require('./encodeFilterArg');

function lessThanOrEqual(column,arg,alias) {	
	var operator = '<=';
	var encoded = encodeFilterArg(column, arg);
	var firstPart = alias + '.' + column._dbName + operator;
	var filter = encoded.prepend(firstPart);		
	return newBoolean(filter);
}

module.exports = lessThanOrEqual;