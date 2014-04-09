function act(c){
	c.newValue1 = 'newValue1';
	c.emitAlias1Changed.expect(c.sut, c.newValue1, c.value1);	
	c.sut.alias1 = c.newValue1;
}

module.exports = act;