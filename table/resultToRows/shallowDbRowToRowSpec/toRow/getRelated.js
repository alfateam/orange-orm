function act(c){
	c.customer = {};
	c.lines = {};

	c.getRelatedRows.expect(c.lineRelation, c.sut).return(c.lines);
	c.getRelatedRows.expect(c.customerRelation, c.sut).return(c.customer);
	
}

module.exports = act;