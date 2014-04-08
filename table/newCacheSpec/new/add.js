function act(c){	
	c.result = 'foo';
	c.cachedValue = 1;
	c.cachedValue2 = 2;		
	c.emitAdded.expect(c.result);
	c.returned = c.sut.tryAdd([c.cachedValue, c.cachedValue2], c.result);
}

module.exports = act;