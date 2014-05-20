function act(c) {
	c.expected = {};
	c.customerStrategy = {};
	c.linesStrategy = {};
	c.initialStrategy = {};
	c.dto = {};
	c.strategy = {};

	c.extractStrategy.expect(c.initialStrategy, c.table).return(c.strategy);

	c.newObject.expect().return(c.dto);

	c.dtoPromise  = {};
	c.dtoPromise.then = c.mock();
	c.dtoPromise.then.expect(JSON.stringify).return(c.expected);
	c.toDto = c.mock();
	c.newToDto.expect(c.strategy, c.table, c.dto).return(c.toDto);
	c.toDto.expect(c.sut).return(c.dtoPromise);	

	c.returned = c.sut.toJSON(c.initialStrategy);	
}

module.exports = act;