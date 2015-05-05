function act(c){
	c.sut.expand('customer');
	c.sut.expand('lines');
}

module.exports = act;