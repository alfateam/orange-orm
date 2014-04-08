
function act(c) {	
	c.sut.add = c.mock();
	c.sut.tryAdd();
}

act.base = '../new';
module.exports = act;