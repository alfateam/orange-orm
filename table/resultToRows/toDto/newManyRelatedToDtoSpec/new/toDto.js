function act(c){
	c.rows = {};
	c.dtos = {};

	c.dtosPromise = c.then();
	c.dtosPromise.resolve(c.dtos);

	c.rows.toDto = c.mock();
	c.rows.toDto.expect(c.lineStrategy).return(c.dtosPromise);

	c.sut(c.rows).then(onResult);

	function onResult() {
		c.didSuccess = true;
	}
}

module.exports = act;