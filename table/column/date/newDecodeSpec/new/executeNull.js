function act(c) {	
	c.value = null;
	c.decodeCore.expect(c.input).return(c.value);
	c.returned = c.sut(c.input);
}

module.exports = act;