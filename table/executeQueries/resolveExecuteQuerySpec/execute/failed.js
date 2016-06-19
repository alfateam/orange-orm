function act(c){
	c.queryCount = 22;
	c.changeSet.queryCount = c.queryCount;
	c.error = {};
	c.onFailed.expect(c.error);
	if (c.queryCompleted)
		c.queryCompleted(c.error, null);
}

module.exports = act;