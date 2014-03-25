function act(c){
	c.customer = {};
	c.lines = {};
	c.lineRelation.getRows = c.mock();
	c.lineRelation.getRows.expect(c.sut).return(c.lines);
	c.customerRelation.getRows = c.mock();
	c.customerRelation.getRows.expect(c.sut).return(c.customer);
}

module.exports = act;