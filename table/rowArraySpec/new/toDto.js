function act(c){
	c.dtoArrayPromise = c.then();
	c.dtoArrayPromise.resolve();
	c.resultToPromise.expect().return(c.dtoArrayPromise);

	c.row = {};
	c.row2 = {};
	c.strategy = {};	

	c.sut[0] = c.row;
	c.sut[1] = c.row2;

	c.row.toDto = c.mock();
	c.dtoPromise = c.then();
	c.dto = {};
	c.dtoPromise.resolve(c.dto);	
	c.row.toDto.expect(c.strategy).return(c.dtoPromise);

	c.row2.toDto = c.mock();
	c.dtoPromise2 = c.then();
	c.dto2 = {};
	c.dtoPromise2.resolve(c.dto2);	
	c.row2.toDto.expect(c.strategy).return(c.dtoPromise2);

	c.expected = {};
	c.orderBy.expect(c.strategy, [c.dto, c.dto2]).return(c.expected);
	 
	c.sut.toDto(c.strategy).then(onOk, console.log);


	function onOk(returned) {
		c.returned = returned;
	}
	
}

module.exports = act;