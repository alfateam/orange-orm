function act(c){
	c.sql = function() {return 'orderNo between ? and ?'};

	c.parameterized = {};
	c.newParameterized.expect(c.sql(), undefined).return(c.parameterized);

	c.filter = {};
	c.newBoolean.expect(c.parameterized).return(c.filter);
	
	c.returned = c.sut({sql: c.sql});
	
}

module.exports = act;