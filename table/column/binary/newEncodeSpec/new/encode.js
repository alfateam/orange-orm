function act(c){	
	c.buffer = new Buffer( [1,2,3] );
	c.purify.expect(c.value).return(c.buffer);

	c.encoded = "E'\\\\x" + c.buffer.toString('hex') + "'";
	c.expected = {};
	c.param.expect(c.encoded).return(c.expected);

	c.returned = c.sut(c.value);
}

module.exports = act;