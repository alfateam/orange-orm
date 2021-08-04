function act(c){
	c.onCompleted = c.mock();
	c.parameters = {};
	c.query = {};
	c.sql = {};
	c.query.parameters = c.parameters;

	c.replaceParamChar.expect(c.query, c.parameters).return(c.sql);

	c.connection.query = 'other';
	c.runQuery.expect(c.sql, c.parameters).expectAnything().whenCalled(onRun);

	c.onInnerCompleted = function() {};

	function onRun(_,__,cb) {
		c.onInnerCompleted = cb;
	}

	c.log.expect(c.sql);
	c.log.expect('parameters: ' + c.parameters);

	c.sut(c.query, c.onCompleted);
}

module.exports = act;