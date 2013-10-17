function act(c) {
	c.expected = 'select _0.id,_0.invoicedCustomerId from order _0';
	c.newQuery();
}

act.base = '../defineTable';
module.exports = act;