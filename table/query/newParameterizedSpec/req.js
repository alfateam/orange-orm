var requireMock = require('a').requireMock;
var newCollection = requireMock('../../newCollection');
var extractSql = requireMock('./extractSql');
var newSut = require('../newParameterized');

module.exports = function(c) {
	c.sut = newSut;
	c.extractSql = extractSql;
	c.text = 'text';
	c.initialText = {};
	c.newCollection = newCollection;
}

