function act(c){
	c.dtoPromise = c.then();
	c.dto = {a: 'bar', f: 1};
	c.expected = JSON.stringify(c.dto);
	c.dtoPromise.resolve(c.dto);

	c.sut.toDto = c.mock();
	c.sut.toDto.expect(c.optionalStrategy).return(c.dtoPromise);

	c.sut.toJSON(c.optionalStrategy).then(onResult);
	
	function onResult(json) {
		c.returned = json;
	}
}

module.exports = act;