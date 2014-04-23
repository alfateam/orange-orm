function act(c){		
	c.rollbackPromise = {};
	c.expected = {};
	c.executeQuery.expect(c.rollbackCommand).return(c.rollbackPromise);

	c.rollbackPromise.then = c.mock();
	c.rollbackPromise.then.expect(c.releaseDbClient).return(c.expected);

	c.returned = c.sut();
}


module.exports = act;