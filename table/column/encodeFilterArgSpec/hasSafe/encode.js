function act(c){	
	c.column.encode.safe = c.mock();
	c.column.encode.safe.expect(c.arg).return(c.expected);
	
	c.returned = c.sut(c.column, c.arg);
}

module.exports = act;