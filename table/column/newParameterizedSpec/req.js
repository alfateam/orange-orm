var requireMock = require('a').requireMock;
var newCollection = requireMock('../../newCollection');
var newSut = require('../newParameterized');

module.exports = function(c) {
	c.sut = newSut;
	c.text = 'text';
	c.newCollection = newCollection;
}

