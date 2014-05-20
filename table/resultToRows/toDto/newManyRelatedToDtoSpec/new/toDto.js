function act(c){
	c.expected;
	c.lineRow = {};
	c.lineRow2 = {};
	c.lineDto = {};
	c.lineDto2 = {};

	c.dtoPromise = 'dtoPromise';	
	c.toDto.expect(c.lineRow).return(c.dtoPromise)
	c.dtoPromise2 = 'dtoPromise2';
	c.toDto.expect(c.lineRow2).return(c.dtoPromise2)

	c.allPromise = {};
	c.allPromise.then = c.mock();
	c.allPromise.then.expectAnything().whenCalled(onAll).return(c.expected);
	c.promise.all.expect([c.dtoPromise, c.dtoPromise2]).return(c.allPromise);

	function onAll(cb) {
		cb([c.lineDto, c.lineDto2]);
	}

	c.returned = c.sut([c.lineRow, c.lineRow2])
}

module.exports = act;