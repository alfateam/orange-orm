var newBoolean = require('./newBoolean');

function greaterThanOrEqual(column,arg,alias) {	
	var operator = '>=';
	var encoded = column.encode(arg);	
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);		
	return newBoolean(filter);
}

module.exports = greaterThanOrEqual;