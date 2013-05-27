var query = {};

function act(c) {
	c.query = query;
	c.sut.add(query);
}

act.base = '../new';
module.exports = act;