function act(c){
	c.filter = {};
	c.filter2 = {};
	c.initialFilter = {};
	c.initialFilter2 = {};
	c.expected = {};

	c.negotiateRawSqlFilter.expect(c.initialFilter).return(c.filter);

	c.filter.and = c.mock();
	c.filter.and.expect(c.initialFilter2).return(c.expected);

	c.returned = c.sut.and(c.initialFilter, c.initialFilter2);
}

module.exports = act;