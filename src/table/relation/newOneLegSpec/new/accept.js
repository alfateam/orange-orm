var mock;
var visitor = {};

function act(c){
	mock = c.mock;	
	visitor.visitOne = mock();
	visitor.visitOne.expect(c.sut);
	c.visitor = visitor;
	c.sut.accept(visitor);
}

act.base = '../new';
module.exports = act;