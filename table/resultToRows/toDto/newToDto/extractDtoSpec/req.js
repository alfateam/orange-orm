var requireMock = require('a').requireMock;

function act(c){
	c.newObject = requireMock('../../../../newObject');
	c.sut = require('../extractDto');
}

module.exports = act;