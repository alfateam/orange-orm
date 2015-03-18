function act(c){
	c.onCompleted = c.mock();
	c.parameters = {};
	c.query = {};
	c.sql = {};
	c.query.parameters = c.parameters;

	c.parameters.toArray = c.mock();
	c.parameterArray = ['para1', 'para2'];
	c.parameters.toArray.expect().return(c.parameterArray);

	c.query.sql = c.mock();
	c.query.sql.expect().return(c.sql);

	c.log.expect(c.sql);
	c.log.expect('parameters: ' + c.parameterArray);

	c.connection.query = 'other';
	c.runQuery.expect(c.sql, c.parameterArray).expect(c.onCompleted);

	c.sut(c.query, c.onCompleted);
}

module.exports = act;