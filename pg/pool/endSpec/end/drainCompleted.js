function act(c){	
	c.pgPool.destroyAllNow = c.mock();
	c.pgPool.destroyAllNow.expect();
	
	c.endCompleted.expect();

	c.drainCompleted();
}

module.exports = act;