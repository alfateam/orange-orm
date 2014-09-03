function act(c){
	c.row = {};
	c.row2 = {};
	c.dto = 'first dto';
	c.dto2 = 'second dto';
	c.dtos = [c.dto, c.dto2];
	c.expected = JSON.stringify(c.dtos);

	c.dtoPromise = c.then();
	c.dtoPromise.resolve(c.dto);
	c.dtoPromise2 = c.then();
	c.dtoPromise2.resolve(c.dto2);
	
	c.strategy = {};	
	c.optionalStrategy = {};
	c.extractStrategy.expect(c.optionalStrategy, c.table).return(c.strategy);

	c.toDto = c.mock();
	c.toDto2 = c.mock();
	c.newToDto.expect(c.strategy, c.table).return(c.toDto);
	c.newToDto.expect(c.strategy, c.table).return(c.toDto2);

	c.toDto.expect(c.row).return(c.dtoPromise);
	c.toDto2.expect(c.row2).return(c.dtoPromise2);

	c.sut[0] = c.row;
	c.sut[1] = c.row2;

	c.sut.toJSON(c.optionalStrategy).then(onResult);

	function onResult(json) {
		c.returned = json;
	}
}

module.exports = act;