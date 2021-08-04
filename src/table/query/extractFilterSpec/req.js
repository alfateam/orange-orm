var requireMock = require('a').requireMock;

function act(c){	
	c.emptyFilter = requireMock('../../emptyFilter');
	c.sut = require('../extractFilter');
}

module.exports = act;