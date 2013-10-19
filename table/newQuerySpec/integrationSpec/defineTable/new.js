function act(c) {
	c.expected = 'select _0.oOrderId,_0.oCustomerId from order _0';
	c.newQuery();
}

act.base = '../defineTable';
module.exports = act;