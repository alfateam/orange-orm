var newParameterized = require('../query/newParameterized');
var newBoolean = require('./newBoolean');
var extractAlias = require('./extractAlias');

function _in(column,values,optionalAlias) {
	if (values.length == 0) {
		var filter =  newParameterized('1=2');
		return newBoolean(filter);
	}
	var alias = extractAlias(optionalAlias);	
	var firstPart = alias + '.' + column._dbName + ' in '; 
	var parameterized = newParameterized(firstPart);	
	var separator = '(';

	for (var i = 0; i < values.length; i++) {
		encoded = column.encode(values[i]);		
		parameterized = parameterized.append(separator).append(encoded);
		separator = ',';		
	};
	var filter =  parameterized.append(')');
	return newBoolean(filter);
};

module.exports = _in;