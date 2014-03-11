var requireMock = require('a').requireMock;

function act(c) {
	c.originalName = 'originalName';
	c.table.originalName = {};		
	c.column.alias = c.originalName;
	c.alias = 'newAlias';
	c.returned = c.sut.as(c.alias);
}

act.base = '../new';
module.exports = act;