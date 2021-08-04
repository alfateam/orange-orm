function act(c){
	c.logger = c.mock();
	c.sut.registerLogger(c.logger);
}

module.exports = act;