function act(c){
    c.connectionString = {};
	c.pool = {};
	c.newPool.expect(c.connectionString).return(c.pool);
	
	c.sut = c.newSut(c.connectionString);
}

module.exports = act;