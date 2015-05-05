function act(c) {
	c.expected = "select _0.oOrderId as s_00,_0.oCustomerId as s_01 from order _0 where (_0.oOrderId=2 OR _0.oOrderId=3) AND _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz' order by _0.oOrderId";
	var filter = c.orderTable.id.eq(2)
	var filter2 = c.orderTable.id.eq(3)
	c.filter = filter.or(filter2);
	c.newQuery();
	
}

module.exports = act;