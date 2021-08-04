function act(c) {
	c.strategy = {
		orderBy: 'customerId asc',
		limit: 10
	};
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order where order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oCustomerId asc limit 10";
	c.newQuery();
}

module.exports = act;