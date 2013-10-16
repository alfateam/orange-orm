function act(c) {
	c.expected = 'select _0.id from order _0';
	c.newQuery();
}

act.base = '../defineTable';
module.exports = act;