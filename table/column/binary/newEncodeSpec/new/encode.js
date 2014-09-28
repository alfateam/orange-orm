function act(c){	
	c.buffer = new Buffer( [1,2,3] );
	c.purify.expect(c.value).return(c.buffer);

	c.encoded = {};
	c.expected = {};
	c.param.expect(c.encoded).return(c.expected);

	c.encodeBuffer = c.mock();
	c.getSessionSingleton.expect('encodeBuffer').return(c.encodeBuffer);
	
	c.encodeBuffer.expect(c.buffer).return(c.encoded);

	c.returned = c.sut(c.value);
}

module.exports = act;