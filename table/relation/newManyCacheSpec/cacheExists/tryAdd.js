var parent = {},
	child = {};

function act(c){

	c.cacheCore = {};
	c.cacheCore.tryAdd = c.mock();
	c.cacheCore.tryAdd.expect(parent, child);
	
	c.domain = {};
	c.domain[c.key] = c.cacheCore;
	process.domain = c.domain;

	c.sut.tryRemove = {};
	c.synchronizeChanged.expect(c.sut, c.joinRelation, parent, child);         
	c.sut.tryAdd(parent, child);
}

module.exports = act;