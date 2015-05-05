function act(c) {
	c.expected = "select _0.oOrderId as s_00,_0.oCustomerId as s_01 from order _0 where _0.oOrderId=2 AND _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz' order by _0.oOrderId";
	c.filter = c.orderTable.id.eq(2);	
	c.newQuery();
	
}

module.exports = act;