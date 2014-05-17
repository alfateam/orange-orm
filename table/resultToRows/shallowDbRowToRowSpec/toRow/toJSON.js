function act(c) {
	c.customerStrategy = {};
	c.linesStrategy = {};
	c.strategy = {customer : c.customerStrategy, lines : linesStrategy};
	c.initialDto;
	c.dto = {};

	c.fieldsToJSON.expect(c.strategy, c.values).return(c.dto);

	c.customer = {};
	c.lines = {};
	c.lines.then = c.mock();
	c.lineRelation.getRows = c.mock();
	c.lineRelation.getRows.expect(c.sut).return(c.lines);

	c.newRelatedtoJSON.expect("customer", c.customerStrategy, c.dto).return()


	c.customer.then = c.mock();
	c.customerRelation.getRows = c.mock();
	c.customerRelation.getRows.expect(c.sut).return(c.customer);


	c.returned = c.sut.toJSON(c.strategy, c.initialDto);
}

module.exports = act;