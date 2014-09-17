function act(c){
	c.err = {};
	c.client = {};
	
	c.done = c.mock();
	
	c.onError.expect(c.err);
	
	c.raiseConnected(c.err, c.client, c.done);
}

module.exports = act;