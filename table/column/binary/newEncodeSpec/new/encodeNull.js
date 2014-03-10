function act(c){
	c.purify.expect(c.value).return(null);
	
	c.encoded = 'null';
	c.expected = {};
	c.param.expect(c.encoded).return(c.expected);
	
	c.returned = c.sut(c.value);
}

module.exports = act;