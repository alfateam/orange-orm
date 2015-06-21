function act(c){
	c.dtoArray = [];
	c.newArray.expect().return(c.dtoArray);
	c.dtoArrayPromise = c.then();
	c.dtoArrayPromise.resolve(c.dtoArray);
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
	 
	c.sut.toDto(c.strategy).then(onOk, console.log);

	c.expected = [c.dto, c.dto2];

	function onOk(returned) {
		c.returned = returned;
	}
	
}

module.exports = act;