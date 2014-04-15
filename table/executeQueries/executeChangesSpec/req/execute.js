function act(c){		
	c.expected = {};
	c.q1 = {};
	c.q2 = {};	
	c.queries = [c.q1, c.q2];
	c.q2Promise = {};
	c.executeQuery.expect(c.q2).return(c.q2Promise);

	c.q1Promise = {};
	c.q1Promise.then = c.mock();
	c.executeQuery.expect(c.q1).return(c.q1Promise);
	c.q1Promise.then.expectAnything().whenCalled(onQ2).return(c.expected);

	function onQ2(next) {
		c.q2Result = next();
	}

	c.returned = c.sut(c.queries);
}


module.exports = act;