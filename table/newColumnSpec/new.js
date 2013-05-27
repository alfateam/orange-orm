var columnName = 'columnName';
var newSut = require('../newColumn');

function act(c) {
	c.columnName = columnName;
	c.sut = newSut(columnName);
}

module.exports = act;