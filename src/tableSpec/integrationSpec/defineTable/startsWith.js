function act(c) {
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order where order.oCustomerId LIKE ? AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oOrderId";
	c.filter = c.orderTable.customerId.startsWith('foo');	
	c.newQuery();
	
}

module.exports = act;