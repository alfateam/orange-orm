function act(c){	
	c.error = {};
	c.onFailed.expect(c.error);
	c.queryCompleted(c.error, null);
}

module.exports = act;