function act(c){
	c.parameterized = {};
	c.newParameterized.expect(undefined).return(c.parameterized);

	c.filter = {};
	c.newBoolean.expect(c.parameterized).return(c.filter);
	
	c.returned = c.sut(undefined);
	
}

module.exports = act;