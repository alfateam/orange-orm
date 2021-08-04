function act(c){
	c.sql = 'orderNo between ? and ?';
	c.parameters = [1,2,3];

	c.arg = {
		sql: c.sql,
		parameters: c.parameters
	};

	c.parameterized = {};
	c.newParameterized.expect(c.sql, c.parameters).return(c.parameterized);

	c.filter = {};
	c.newBoolean.expect(c.parameterized).return(c.filter);
	
	c.returned = c.sut(c.arg);
	
}

module.exports = act;