async function act(c){
	c.key = 1234567890;
	c.intKey = '<intKey>';
	c.toIntKey.expect(c.key).return(c.intKey);

	c.query.expect('SELECT pg_advisory_lock(<intKey>)').return();
	c.query.expect('SELECT pg_advisory_unlock(<intKey>)').return();
	
	c.expected = {};
	c.returned = await c.sut(c.key, () => c.expected);
}

module.exports = act;