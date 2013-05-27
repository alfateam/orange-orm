var query = {};

function act(c) {
	c.query2 = query;
	c.sut.add(query);
}

act.base = '../add';
module.exports = act;