function act(c) {
	c.expected = "select _0.oOrderId as s_00,_0.oCustomerId as s_01 from order _0 where _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz' order by _0.oOrderId";
	c.expected2 = "select _0_0.lId as s_0_00,_0_0.lLineNo as s_0_01,_0_0.lOrderId as s_0_02 from orderLine _0_0 INNER JOIN order _0 ON (_0_0.lOrderId=_0.oOrderId AND _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz') order by _0.oOrderId";

	c.newQuery();	
}

module.exports = act;