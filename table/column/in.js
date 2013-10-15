var newParameterized = require('../query/newParameterized');
var extractAlias = require('./extractAlias');

function _in(column,values,optionalAlias) {
	if (values.length == 0)
		return newParameterized('1=2');
	var alias = extractAlias(optionalAlias);	
	var firstPart = alias + '.' + column.name + ' in '; 
	var parameterized = newParameterized(firstPart);	
	var separator = '(';

	for (var i = 0; i < values.length; i++) {
		encoded = column.purifyThenEncode(values[i]);		
		parameterized = parameterized.append(separator).append(encoded);
		separator = ',';		
	};
	return parameterized.append(')');
};

module.exports = _in;