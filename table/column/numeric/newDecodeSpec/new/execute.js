
function act(c) {	
	c.value = 325;
	c.decodeCore.expect(c.input).return(c.value);
	c.returned = c.sut(c.input);
}

module.exports = act;