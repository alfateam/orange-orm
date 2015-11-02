var requireMock = require('a').requireMock;
var extractSql = requireMock('./extractSql');
var extractParameters = requireMock('./parameterized/extractParameters');
var newSut = require('../newParameterized');

module.exports = function(c) {
	c.sut = newSut;
	c.extractSql = extractSql;
	c.text = 'text';
	c.initialText = {};
	c.extractParameters = extractParameters;
}

