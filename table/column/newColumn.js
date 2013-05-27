var filter = require('./filter');

module.exports = function(name) {
	var c = {};
	c.columnName = name;
	c.name = name;	

	//todo move to integer
	c.equal = function(arg) {
		return filter.equal(c,arg);
	};
	return c;
};