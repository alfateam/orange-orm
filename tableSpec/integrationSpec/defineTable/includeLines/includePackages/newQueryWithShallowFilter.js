function act(c) {
	c.filter = c.orderTable.id.eq(1);

	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order where order.oOrderId=1 AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oOrderId" ;
 	c.expected2 = "select order_0.lId as sorder_00,order_0.lLineNo as sorder_01,order_0.lOrderId as sorder_02 from orderLine order_0 INNER JOIN order order ON (order_0.lOrderId=order.oOrderId AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz') where order.oOrderId=1 order by order_0.lId";
	c.expected3 = "select order_0_0.pId as sorder_0_00,order_0_0.pLineId as sorder_0_01,order_0_0.pArticleId as sorder_0_02 from package order_0_0 INNER JOIN orderLine order_0 ON (order_0_0.pLineId=order_0.lId) INNER JOIN order order ON (order_0.lOrderId=order.oOrderId AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz') where order.oOrderId=1 order by order_0_0.pId";


	c.newQuery();	
}

module.exports = act;