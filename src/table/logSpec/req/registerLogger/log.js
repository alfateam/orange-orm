function act(c){
	c.logger.expect(c.arg);
	c.sut(c.arg);
}

module.exports = act;