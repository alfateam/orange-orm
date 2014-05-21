function act(c){
	c.expected = {};
	c.row = {};
	c.row2 = {};
	c.dtoPromise = {};
	c.dtoPromise2 = {};
	c.strategy = {};	
	c.optionalStrategy = {};
	c.extractStrategy.expect(c.optionalStrategy, c.table).return(c.strategy);

	c.toDto = c.mock();
	c.toDto2 = c.mock();
	c.newToDto.expect(c.strategy, c.table).return(c.toDto);
	c.newToDto.expect(c.strategy, c.table).return(c.toDto2);

	c.toDto.expect(c.row).return(c.dtoPromise);
	c.toDto2.expect(c.row2).return(c.dtoPromise2);

	c.allPromise = {};
	c.allPromise.then = c.mock();
	c.allPromise.then.expect(JSON.stringify).return(c.expected);
	c.promise.all.expect([c.dtoPromise, c.dtoPromise2]).return(c.allPromise);

	c.sut[0] = c.row;
	c.sut[1] = c.row2;

	c.returned = c.sut.toJSON(c.optionalStrategy);
}

module.exports = act;