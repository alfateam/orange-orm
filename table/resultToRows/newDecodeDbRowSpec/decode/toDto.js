function act(c) {
	c.expected = {};
	c.initialStrategy = {};
	c.strategy = {};

	c.extractStrategy.expect(c.initialStrategy, c.table).return(c.strategy);

	c.expected = {};
	c.toDto.expect(c.strategy, c.table, c.sut).return(c.expected);

	c.returned = c.sut.toDto(c.initialStrategy);	
}

module.exports = act;