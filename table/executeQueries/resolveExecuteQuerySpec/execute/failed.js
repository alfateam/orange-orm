function act(c){	
	c.error = {};
	c.onFailed.expect(c.error);
	if (c.queryCompleted)
		c.queryCompleted(c.error, null);
}

module.exports = act;