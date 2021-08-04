var mock;
var visitor = {};

function act(c){
	mock = c.mock;	
	visitor.visitMany = mock();
	visitor.visitMany.expect(c.sut);
	c.visitor = visitor;		
	c.sut.accept(visitor);
}

act.base = '../new';
module.exports = act;