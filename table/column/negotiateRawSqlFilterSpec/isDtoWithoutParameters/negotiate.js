function act(c){
	c.sql = 'orderNo between ? and ?';
	c.param1 = 3;
	c.param2 = 5;

	c.arg = {
		sql: c.sql
	};

	c.parameterized = {};
	c.newParameterized.expect(c.sql).return(c.parameterized);

	c.filter = {};
	c.newBoolean.expect(c.parameterized).return(c.filter);
	
	c.returned = c.sut(c.arg);
	
}

module.exports = act;