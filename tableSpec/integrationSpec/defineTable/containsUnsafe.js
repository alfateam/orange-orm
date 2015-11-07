function act(c) {
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order where order.oCustomerId LIKE ? AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oOrderId";
	c.expectedParam = '%foo_%';
	c.filter = c.orderTable.customerId.contains('foo_');	
	c.newQuery();
	var query = c.returned[0];
	c.returnedSql = query.sql();

	c.returnedParameters = query.parameters;
}

module.exports = act;