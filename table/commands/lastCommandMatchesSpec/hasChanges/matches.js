function act(c){
	c.expected = {};
	c.lastChange = {};
	c.lastChange.matches = c.mock();
	c.lastChange.matches.expect(c.row).return(c.expected);
	c.changeSet = [c.lastChange];
	c.getChangeSet.expect().return(c.changeSet);

	c.returned = c.sut(c.row);
}

module.exports = act;