function act(c){
	c.callback = {};

	c.emitArbitaryChanged.add = c.mock();
	c.emitArbitaryChanged.add.expect(c.callback);
	
	c.sut.subscribeChanged(c.callback);
}

module.exports = act;