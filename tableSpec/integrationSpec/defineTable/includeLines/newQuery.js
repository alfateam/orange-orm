function act(c) {
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order where order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oOrderId";

	c.newQuery();	
}

module.exports = act;