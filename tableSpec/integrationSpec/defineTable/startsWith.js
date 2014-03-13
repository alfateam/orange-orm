function act(c) {
	c.expected = "select _0.oOrderId,_0.oCustomerId from order _0 where _0.oCustomerId LIKE 'foo%' AND _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz'";
	c.filter = c.orderTable.customerId.startsWith('foo');	
	c.newQuery();
	
}

module.exports = act;