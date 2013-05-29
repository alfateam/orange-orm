//todo
var c = {};

c.equal = function(column,arg) {
	return encode(column,arg,'=');};

c.notEqual = function(column,arg) {
	return encode(column,arg,'<>');
};

function encode(column,arg,operator) {
	var parameterized = column.encode(arg);	
	var firstPart = '_0.' + column.name + operator;
	return parameterized.prepend(firstPart);	
}

module.exports = c;
