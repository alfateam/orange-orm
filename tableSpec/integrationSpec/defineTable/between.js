function act(c) {
	c.expected = "select _0.oOrderId as s_00,_0.oCustomerId as s_01 from order _0 where _0.oCustomerId>='2' AND _0.oCustomerId<='10' AND _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz'";
	c.filter = c.orderTable.customerId.between('2','10');	
	c.newQuery();
	
}

module.exports = act;