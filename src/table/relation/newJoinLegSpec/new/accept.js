var mock;
var visitor = {};

function act(c){
	mock = c.mock;	
	visitor.visitJoin = mock();
	visitor.visitJoin.expect(c.sut);
	c.visitor = visitor;
	c.sut.accept(visitor);
}

act.base = '../new';
module.exports = act;