function act(c){
	c.callback = {};
	c.emitAlias1Changed.tryRemove = c.mock();
	c.emitAlias1Changed.tryRemove.expect(c.callback);	
	c.emitAlias2Changed.tryRemove = c.mock();
	c.emitAlias2Changed.tryRemove.expect(c.callback);
	c.sut.unsubscribeChanged(c.callback);
}

module.exports = act;