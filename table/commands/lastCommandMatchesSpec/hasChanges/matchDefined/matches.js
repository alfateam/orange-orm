function act(c){
	c.expected = {};
	c.lastChange.matches.expect(c.row).return(c.expected);
	c.returned = c.sut(c.row);
}

module.exports = act;