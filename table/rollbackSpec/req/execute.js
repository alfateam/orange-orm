function act(c){		
	c.expected = {};

	c.emptyPromise = {};
	c.resultToPromise.expect().return(c.emptyPromise);

	c.emptyPromise.then = c.mock();
	c.popPromise = {};
	c.emptyPromise.then.expect(c.popChanges).return(c.popPromise);
	
	c.executeQuery.bind = c.mock();
	c.boundExecuteQuery = {};
	c.executeQuery.bind.expect(null, c.rollbackCommand).return(c.boundExecuteQuery);

	c.popPromise.then = c.mock();
	c.rollbackPromise = {};
	c.popPromise.then.expect(c.boundExecuteQuery).return(c.rollbackPromise);

	c.rollbackPromise.then = c.mock();
	c.releasePromise = {};
	c.rollbackPromise.then.expect(c.releaseDbClient).return(c.releasePromise);

	c.error = {};
	c.newThrow.expect(c.error, c.releasePromise).return(c.expected);
	
	c.returned = c.sut(c.error);
}


module.exports = act;