var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var visitor = {};

function act(c){
	visitor.visitJoin = mock();
	visitor.visitJoin.expect(c.sut);
	c.visitor = visitor;	
	c.sut.accept(visitor);
}

act.base = '../new'
module.exports = act;