function act(c) {
	c.expected = "select _0.oOrderId as s_00,_0.oCustomerId as s_01 from order _0 where _0.oCustomerId<>'2' AND _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz'";
	c.filter = c.orderTable.customerId.ne('2');	
	c.newQuery();
	
}

module.exports = act;