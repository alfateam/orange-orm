function act(c){	
	c.arg = {};
	c.done.expect(c.arg);

	c.endCompleted(c.arg);
}

module.exports = act;