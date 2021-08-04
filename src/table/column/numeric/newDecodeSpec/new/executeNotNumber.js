
function act(c) {	
	c.value = '45.234';
	c.expected = 45.234;
	c.decodeCore.expect(c.input).return(c.value);
	c.returned = c.sut(c.input);
}

module.exports = act;