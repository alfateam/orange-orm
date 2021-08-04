function act(c) {
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1,order_0.cCustomerId as sorder_00,order_0.cName as sorder_01,order_0.cCountryId as sorder_02,order_0_0.yCountryId as sorder_0_00,order_0_0.yCountryName as sorder_0_01 from order order LEFT JOIN customer order_0 ON (order.oCustomerId=order_0.cCustomerId) LEFT JOIN country order_0_0 ON (order_0.cCountryId=order_0_0.yCountryId) where order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oOrderId";

	c.newQuery();	
}

module.exports = act;