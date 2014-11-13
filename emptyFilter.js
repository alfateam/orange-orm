var parameterized = require('./table/query/newParameterized')('');
var c = {};

c.sql = parameterized.sql;
c.parameters = parameterized.parameters;

c.and = function(other) {
	return other;
};

c.or = c.and;

c.not = function() {
	return c;
};

module.exports = c;
