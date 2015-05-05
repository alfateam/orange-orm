function act(c){
	c.callback = {};
	c.emitArbitaryChanged.tryRemove = c.mock();
	c.emitArbitaryChanged.tryRemove.expect(c.callback);	
	c.sut.unsubscribeChanged(c.callback);
}

module.exports = act;