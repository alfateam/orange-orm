var a = require('a');
var mock = a.mock;

function act(c){
	c.mock = mock;		
	c.newId = a.requireMock('../../newId');

	c.sut = require('../negotiateId');
}

module.exports = act;