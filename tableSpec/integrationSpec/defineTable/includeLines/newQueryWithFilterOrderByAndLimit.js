function act(c) {
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order " + 
				"where order.oOrderId=2 AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' "  + 
				"order by order.oCustomerId desc limit 8";

	c.expected2 = "select order_0.lId as sorder_00,order_0.lLineNo as sorder_01,order_0.lOrderId as sorder_02 from orderLine order_0 INNER JOIN (select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order where order.oOrderId=2 AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oCustomerId desc limit 8) order ON (order_0.lOrderId=order.oOrderId AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz') where order.oOrderId=2 order by order.oOrderId";

	c.strategy.orderBy = 'customerId desc';
	c.strategy.limit = 8;
	c.filter = c.orderTable.id.eq(2);	

	c.newQuery();	
}

module.exports = act;