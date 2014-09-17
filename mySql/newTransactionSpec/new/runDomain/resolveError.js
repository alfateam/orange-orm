function act(c){
	c.err = {};	
	c.onError.expect(c.err);

	c.raiseConnected(c.err);
}

module.exports = act;