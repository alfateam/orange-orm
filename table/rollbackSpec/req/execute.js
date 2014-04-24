function act(c){		
	c.popChanges.expect();
	
	c.rollbackPromise = {};
	c.expected = {};
	c.executeQuery.expect(c.rollbackCommand).return(c.rollbackPromise);

	c.rollbackPromise.then = c.mock();
	c.releasePromise = {};
	c.releasePromise.then = c.mock();
	c.rollbackPromise.then.expect(c.releaseDbClient).return(c.releasePromise);

	c.error = {};
	c.newThrow.expect(c.error, c.releasePromise).return(c.expected);
	
	c.returned = c.sut(c.error);
}


module.exports = act;