function act(c){	
	c.column.encode.expect(c.arg).return(c.expected);
	
	c.returned = c.sut(c.column, c.arg);
}

module.exports = act;