function act(c) {
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1,order_0.dId as sorder_00,order_0.dOrderId as sorder_01 from order order LEFT JOIN deliveryParty order_0 ON (order.oOrderId=order_0.dOrderId) where order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oOrderId";
	c.newQuery();	
}

module.exports = act;