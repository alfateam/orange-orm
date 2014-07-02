function act(c) {
	c.expected = {};
	c.customerStrategy = {};
	c.linesStrategy = {};
	c.initialStrategy = {};

	c.dtoPromise  = {};
	c.dtoPromise.then = c.mock();
	c.dtoPromise.then.expect(JSON.stringify).return(c.expected);
	c.toDto = c.mock();
	c.sut.toDto = c.toDto;
	c.toDto.expect(c.initialStrategy).return(c.dtoPromise);	

	c.returned = c.sut.toJSON(c.initialStrategy);	
}

module.exports = act;