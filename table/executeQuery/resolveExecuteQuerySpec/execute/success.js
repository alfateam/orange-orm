function act(c){	
	c.result = {};
	c.onSuccess.expect(c.result);
	c.queryCompleted(null,c.result);
}

module.exports = act;