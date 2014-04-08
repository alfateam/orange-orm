var parent = {},
	child = {};

function act(c){
	c.cacheCore = {};
	c.cacheCore.tryRemove = c.mock();
	c.cacheCore.tryRemove.expect(parent, child);	
		
	c.domain = {};
	c.domain[c.key] = c.cacheCore;
	process.domain = c.domain;

	c.sut.tryRemove(parent, child);
}

module.exports = act;