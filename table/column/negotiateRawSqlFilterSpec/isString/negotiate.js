function act(c){
	c.sql = 'orderNo between ? and ?';

	c.parameterized = {};
	c.newParameterized.expect(c.sql).return(c.parameterized);

	c.filter = {};
	c.newBoolean.expect(c.parameterized).return(c.filter);
	
	c.returned = c.sut(c.sql);
	
}

module.exports = act;