var requireMock = require('a').requireMock;

function act(c){
	c.nodeUid = requireMock('node-uuid');
	c.v4 = {};
	c.nodeUid.v4 = c.v4;
	
	c.returned = require('../newId');
}

module.exports = act;