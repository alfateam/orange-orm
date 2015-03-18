function act(c){
	c.onCompleted = c.mock();
	c.parameters = {};
	c.query = {};
	c.sql = {};
	c.query.parameters = c.parameters;


	c.parameters.toArray = c.mock();
	c.parameterArray = ['para1', 'para2'];
	c.parameters.toArray.expect().return(c.parameterArray);

	c.replaceParamChar.expect(c.query, c.parameterArray).return(c.sql);

	c.connection.query = 'other';
	c.runQuery.expect(c.sql, c.parameterArray).expectAnything().whenCalled(onRun);

	c.onInnerCompleted = function() {};

	function onRun(_,__,cb) {
		c.onInnerCompleted = cb;
	}

	c.log.expect(c.sql);
	c.log.expect('parameters: ' + c.parameterArray);

	c.sut(c.query, c.onCompleted);
}

module.exports = act;