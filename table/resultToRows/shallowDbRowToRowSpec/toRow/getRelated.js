function act(c){
	c.lines = {};	
	c.getLines = c.mock();
	c.getLines.expect().return(c.lines);

	c.lineRelation.toGetRelated = c.mock();
	c.lineRelation.toGetRelated.expect(c.sut).return(c.getLines);

	c.customer = {};
	c.getCustomer = c.mock();
	c.getCustomer.expect().return(c.customer);
	
	c.customerRelation.toGetRelated = c.mock();
	c.customerRelation.toGetRelated.expect(c.sut).return(c.getCustomer);
}

module.exports = act;