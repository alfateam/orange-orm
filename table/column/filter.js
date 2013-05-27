//todo
var c = {};

c.equal_number = function(column,arg) {
	var parameterized = column.encode(arg);
	var firstPart = '_0.' + column.name + '=';
	return parameterized.prepend(firstPart);
};

module.exports = c;
