function act(c){
	c.callback = {};
	c.emitAlias1Changed.tryRemove = c.mock();
	c.emitAlias1Changed.tryRemove.expect(c.callback);
	c.sut.unsubscribeChanged(c.alias1, c.callback);
}

module.exports = act;