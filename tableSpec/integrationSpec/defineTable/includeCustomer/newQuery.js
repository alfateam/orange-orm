function act(c) {
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1,order_0.cCustomerId as sorder_00,order_0.cName as sorder_01,order_0.cCountryId as sorder_02 from order order LEFT JOIN customer order_0 ON (order.oCustomerId=order_0.cCustomerId) where order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oOrderId";
	c.newQuery();	
}

act.base = '../includeCustomer';
module.exports = act;