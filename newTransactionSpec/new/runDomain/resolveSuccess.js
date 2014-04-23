function act(c){
	
	c.success = c.mock();
	c.success.expect();
	c.client = {};
	c.done = {};
	c.raiseConnected(null, c.client, c.done);
	c.sut(c.success);	
}

module.exports = act;