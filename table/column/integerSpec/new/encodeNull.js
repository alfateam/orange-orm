
function act(c) {
	c.expected = '' + c.dbNull;
	c.returned = c.sut.encode(null);
}

act.base = '../new';
module.exports = act;