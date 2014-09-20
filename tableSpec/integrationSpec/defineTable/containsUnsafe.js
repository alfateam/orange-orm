function act(c) {
	c.expected = "select _0.oOrderId,_0.oCustomerId from order _0 where _0.oCustomerId LIKE '%?%' AND _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz'";
	c.expectedParam = 'foo_';
	c.filter = c.orderTable.customerId.contains(c.expectedParam);	
	c.newQuery();
	var query = c.returned[0];
	c.returnedSql = query.sql();

	c.returnedParameters = query.parameters.toArray();
	
}

module.exports = act;