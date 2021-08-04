function act(c){
	c.key = 1234567890;
	c.intKey = '<intKey>';
	c.toIntKey.expect(c.key).return(c.intKey);

	c.expected = {};
	c.query.expect('SELECT pg_advisory_xact_lock(<intKey>)').return(c.expected);

	c.returned =  c.sut(c.key);
}

module.exports = act;