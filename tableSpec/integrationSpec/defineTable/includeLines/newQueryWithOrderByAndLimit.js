function act(c) {
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order where order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oCustomerId desc limit 8";
	c.expected2 = "select order_0.lId as sorder_00,order_0.lLineNo as sorder_01,order_0.lOrderId as sorder_02 from orderLine order_0 INNER JOIN order order ON (order_0.lOrderId=order.oOrderId AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz') order by order.oOrderId";
	c.strategy.orderBy = 'customerId desc';
	c.strategy.limit = 8;
	c.newQuery();	
}

module.exports = act;