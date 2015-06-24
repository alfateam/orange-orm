function act(c) {
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order where (order.oOrderId=2 OR order.oOrderId=3) AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oOrderId";
	var filter = c.orderTable.id.eq(2)
	var filter2 = c.orderTable.id.eq(3)
	c.filter = filter.or(filter2);
	c.newQuery();
	
}

module.exports = act;