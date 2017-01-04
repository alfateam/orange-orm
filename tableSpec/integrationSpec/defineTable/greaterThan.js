function act(c) {
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order where order.oCustomerId>'2' AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oOrderId";
	c.filter = c.orderTable.customerId.greaterThan('2');	
	c.newQuery();
	
}

module.exports = act;