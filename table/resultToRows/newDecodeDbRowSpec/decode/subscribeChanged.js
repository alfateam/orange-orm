function act(c){
	c.callback = {};
	c.emitAlias1Changed = c.mock();
	c.newEmitEvent.expect().return(c.emitAlias1Changed)

	c.emitAlias1Changed.add = c.mock();
	c.emitAlias1Changed.add.expect(c.callback);
	c.sut.subscribeChanged(c.callback, c.alias1);
}

module.exports = act;