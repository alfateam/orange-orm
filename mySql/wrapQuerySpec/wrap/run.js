function act(c){
	c.onCompleted = c.mock();
	c.parameters = {};
	c.query = {};
	c.sql = {};
	c.query.parameters = c.parameters;

	c.query.sql = c.mock();
	c.query.sql.expect().return(c.sql);

	c.log.expect(c.sql);
	c.log.expect('parameters: ' + c.parameters);

	c.connection.query = 'other';
	c.runQuery.expect(c.sql, c.parameters).expect(c.onCompleted).return(c.expected);

	c.sut(c.query, c.onCompleted);
}

module.exports = act;