function act(c) {
	c.expected = {};
	c.customerStrategy = {};
	c.linesStrategy = {};
	c.initialStrategy = {};
	c.strategy = {};

	c.extractStrategy.expect(c.initialStrategy, c.table).return(c.strategy);

	c.toDto = c.mock();
	c.newToDto.expect(c.strategy, c.table).return(c.toDto);
	c.toDto.expect(c.sut).return(c.expected);	

	c.returned = c.sut.toDto(c.initialStrategy);	
}

module.exports = act;