
function act(c) {	
	c.value = {};
	c.decodeCore.expect(c.input).return(c.value);
	c.clonedValue = c.clonedValue;
	c.cloneDate.expect(c.value).return(c.clonedValue);
	c.returned = c.sut(c.input);
}

module.exports = act;