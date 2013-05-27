var	table = {};
table.primaryColumns = [{},{}];

function act(c) {
	c.table = table;
	c.arg1 = {};
	c.arg2 = {};
	c.sut = require('../extractStrategy');
}

module.exports = act;