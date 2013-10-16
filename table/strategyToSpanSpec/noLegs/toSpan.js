var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var strategy;
var legs = {};

function act(c){	
	c.newCollection.expect().return(legs);
	c.legs = legs;
	c.returned = c.sut(c.table,strategy);
}

act.base = '../req';
module.exports = act;