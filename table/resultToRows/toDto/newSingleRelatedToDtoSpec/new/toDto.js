function act(c){
	c.expected;
	c.customerRow = {};
	c.customerDto = {};
	c.thenPromise = {};	
	c.thenDto = c.mock();
	c.thenDto.expectAnything().whenCalled(onThenDto).return(c.expected);
	c.thenPromise.then = c.thenDto;

	function onThenDto(cb) {
		cb(c.customerDto);
	}
	c.toDto.expect(c.customerRow).return(c.thenPromise)
	c.returned = c.sut(c.customerRow)
}

module.exports = act;