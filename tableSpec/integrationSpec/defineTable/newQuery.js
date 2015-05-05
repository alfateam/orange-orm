function act(c) {
	c.expected = "select _0.oOrderId as s_00,_0.oCustomerId as s_01 from order _0 where _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz' order by _0.oOrderId";
	c.newQuery();
}

module.exports = act;