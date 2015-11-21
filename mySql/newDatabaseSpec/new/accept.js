function act(c){

	c.context = {};
	c.context.visitMySql = c.mock();
	c.context.visitMySql.expect();
	
	c.sut.accept(c.context);
}

module.exports = act;