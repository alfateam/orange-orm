function act(c){
	c.callback = {};
	c.emitAlias1Changed.add = c.mock();
	c.emitAlias1Changed.add.expect(c.callback);
	c.emitAlias2Changed.add = c.mock();
	c.emitAlias2Changed.add.expect(c.callback);
	c.sut.subscribeChanged(c.callback);
}

module.exports = act;