var a = require('a');

function act(c){
	c.newCache = a.requireMock('../newCache');
	c.id = 'id';
	c.sut = require('../getCache');
}

module.exports = act;