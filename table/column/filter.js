var newParameterized = require('./newParameterized');
var c = {};

c.equal = function(column,arg) {
	return encodeNullable(column,arg,'=',' is ');
};

c.eq = c.equal;
c.EQ = c.eq;

c.notEqual = function(column,arg) {
	return encodeNullable(column,arg,'<>',' is not ');
};

c.ne = c.notEqual;
c.NE = c.ne;
	

c.greaterThan = function(column,arg) {
	return encode(column,arg,'>');
};

c.gt = c.greaterThan;
c.GT = c.gt;

c.greaterThanOrEqual = function(column,arg) {
	return encode(column,arg,'>=');
};

c.ge = c.greaterThanOrEqual;
c.GE = c.ge;

c.lessThan = function(column,arg) {
	return encode(column,arg,'<=');
};

c.lt = c.lessThan;
c.LT = c.lt;

c.lessThanOrEqual = function(column,arg) {
	return encode(column,arg,'<=');
};

c.le = c.lessThanOrEqual;
c.LE = c.le;

c.startsWith = function(column,arg) {
	arg = arg + '%';
	return encode(column,arg,' LIKE ');
};

c.endsWith = function(column,arg) {
	arg =  '%' + arg;
	return encode(column,arg,' LIKE ');
};


c.in = function(column,values) {
	if (values.length == 0)
		return newParameterized('1=2');
	var firstPart = '_0.' + column.name + ' in '; 
	var parameterized = newParameterized(firstPart);	
	var separator = '(';

	for (var i = 0; i < values.length; i++) {
		encoded = column.encode(values[i]);		
		parameterized = parameterized.append(separator).append(encoded);
		separator = ',';		
	};
	return parameterized.append(')');
};

function encodeNullable(column,arg,operator,nullOperator) {		
	var encoded = column.encode(arg);	
	if (encoded.sql() == 'null') 
		operator = nullOperator;
	return encodeCore(column,encoded,operator);
}

function encode(column,arg,operator) {		
	var encoded = column.encode(arg);	
	return encodeCore(column,encoded,operator);	
}

function encodeCore(column,encoded,operator) {
	var firstPart = '_0.' + column.name + operator;
	return encoded.prepend(firstPart);		
}

module.exports = c;
