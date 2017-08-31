function act(c) {
	c.filter = c.orderTable.id.eq(1);

	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order where order.oOrderId=1 AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oOrderId" ;

	c.newQuery();	
}

module.exports = act;