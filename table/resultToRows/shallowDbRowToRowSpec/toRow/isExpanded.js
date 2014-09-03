function act(c){
	c.expected = {};
	c.getCustomer.expanded = c.expected;
	c.returned = c.sut.isExpanded('customer');
}

module.exports = act;