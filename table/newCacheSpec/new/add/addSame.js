function act(c){	
	c.returned = c.sut.tryAdd([c.cachedValue, c.cachedValue2], 'bar');
}

module.exports = act;