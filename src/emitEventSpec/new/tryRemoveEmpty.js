
function act(c) {	
	c.sut.remove = c.mock();
	c.sut.tryRemove();
}

act.base = '../new';
module.exports = act;