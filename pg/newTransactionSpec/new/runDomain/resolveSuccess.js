function act(c){
	c.onSuccess.expect();
	c.client = {};
	c.done = {};
	c.raiseConnected(null, c.client, c.done);
}

module.exports = act;