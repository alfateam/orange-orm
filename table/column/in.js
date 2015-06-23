var newParameterized = require('../query/newParameterized');
var newBoolean = require('./newBoolean');

function _in(column,values,alias) {
	var filter;
	if (values.length === 0) {
		filter =  newParameterized('1=2');
		return newBoolean(filter);
	}
	var firstPart = alias + '.' + column._dbName + ' in '; 
	var parameterized = newParameterized(firstPart);	
	var separator = '(';

	for (var i = 0; i < values.length; i++) {
		var encoded = column.encode(values[i]);		
		parameterized = parameterized.append(separator).append(encoded);
		separator = ',';		
	}
	filter =  parameterized.append(')');
	return newBoolean(filter);
}

module.exports = _in;