var id = {};

function act(c) {	
	c.expected = {};
	c.insert.expect(c.sut,id).return(c.expected);
	c.returned = c.sut.insert(id);
}

act.base = '../new';
module.exports = act;