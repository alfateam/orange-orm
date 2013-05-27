function act(c) {
	c.mock = require('a_mock').mock;
	c.column = {};
	c.column.name = 'columnName';
	c.sut = require('../filter');
}

module.exports = act;