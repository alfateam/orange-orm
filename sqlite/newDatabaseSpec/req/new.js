function act(c){
    c.connectionString = {};
	c.poolOptions = {};
	c.pool = {};
	c.newPool.expect(c.connectionString, c.poolOptions).return(c.pool);
	
	c.sut = c.newSut(c.connectionString, c.poolOptions);
}

module.exports = act;