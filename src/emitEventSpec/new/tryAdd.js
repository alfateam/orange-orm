var callback = 'foo';

function act(c) {	
	c.sut.add = c.mock();
	c.sut.add.expect(callback);
	c.sut.tryAdd(callback);
}

act.base = '../new';
module.exports = act;