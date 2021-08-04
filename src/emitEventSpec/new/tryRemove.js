var callback = 'foo';

function act(c) {	
	c.sut.remove = c.mock();
	c.sut.remove.expect(callback);
	c.sut.tryRemove(callback);
}

act.base = '../new';
module.exports = act;