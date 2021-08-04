function act(c) {
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order where EXISTS (SELECT _2.yCountryId FROM country AS _2 INNER JOIN customer _1 ON (_2.yCountryId=_1.cCountryId) WHERE order.oCustomerId=_1.cCustomerId AND _2.yCountryName='norway') AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oOrderId";
	c.filter = c.orderTable.customer.country.name.eq('norway');	
	c.newQuery();
	
}

module.exports = act;