var requireMock = require('a').requireMock;

function act(c){	
	c.newEmptyFilter = requireMock('./newParameterized');;
	c.sut = require('../extractFilter');
}

module.exports = act;