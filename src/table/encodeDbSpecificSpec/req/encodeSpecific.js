function act(c){
	c.expected = {};
	c.value = {};
		
	c.encodeBoolean = c.mock();
	c.getSessionSingleton.expect('encodeBoolean').return(c.encodeBoolean);
	c.encodeBoolean.expect(c.value).return(c.expected);
	c.getSessionSingleton.expect(c.encodeBoolean);
	c.returned = c.sut('Boolean', c.value)
}

module.exports = act;