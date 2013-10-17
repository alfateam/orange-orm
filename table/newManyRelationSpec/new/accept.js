var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.visitor = {};

	c.visitor.visitMany = mock();
	c.visitor.visitMany.expect(c.sut).return();
	
	c.sut.accept(c.visitor);
}

act.base = '../new'
module.exports = act;