function act(c) {
	c.expected = 'select _0.oOrderId,_0.oCustomerId from order _0 where _0.discriminatorColumn=\'foo\' AND _0.discriminatorColumn2=\'baz\'';
	c.newQuery();
}

act.base = '../defineTable';
module.exports = act;