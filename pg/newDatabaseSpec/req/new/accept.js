function act(c){

	c.context = {};
	c.context.visitPg = c.mock();
	c.context.visitPg.expect();
	
	c.sut.accept(c.context);
}

module.exports = act;