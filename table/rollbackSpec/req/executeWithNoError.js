function act(c){		
	c.popChanges.expect();
	
	c.rollbackPromise = {};
	c.expected = {};
	c.executeQuery.expect(c.rollbackCommand).return(c.rollbackPromise);

	c.rollbackPromise.then = c.mock();
	c.releasePromise = c.expected;
	c.releasePromise.then = c.mock();
	c.rollbackPromise.then.expect(c.releaseDbClient).return(c.releasePromise);
	
	c.returned = c.sut();
}


module.exports = act;