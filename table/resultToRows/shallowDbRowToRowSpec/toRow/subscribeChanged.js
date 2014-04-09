function act(c){
	c.callback = {};
	c.emitAlias1Changed.add = c.mock();
	c.emitAlias1Changed.add.expect(c.callback);
	c.sut.subscribeChanged(c.alias1, c.callback);
}

module.exports = act;