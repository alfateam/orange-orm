function act(c) {
	c.expected = "select _0.oOrderId,_0.oCustomerId from order _0 where EXISTS (SELECT _2.yCountryId FROM country AS _2 INNER JOIN customer _1 ON (_1.cCountryId=_2.yCountryId) WHERE _0.oCustomerId=_1.cCustomerId AND _2.yCountryName='norway') AND _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz'";
	c.filter = c.orderTable.customer.country.name.eq('norway');	
	c.newQuery();
	
}

module.exports = act;