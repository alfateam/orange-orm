
function act(c) {	
	c.returned = c.sut.decode(c.dbNull);
}

act.base = '../new';
module.exports = act;