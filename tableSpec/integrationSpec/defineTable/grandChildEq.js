function act(c) {
	c.expected = "select _0.oOrderId as s_00,_0.oCustomerId as s_01 from order _0 where EXISTS (SELECT _2.yCountryId FROM country AS _2 INNER JOIN customer _1 ON (_2.yCountryId=_1.cCountryId) WHERE _0.oCustomerId=_1.cCustomerId AND _2.yCountryName='norway') AND _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz' order by _0.oOrderId";
	c.filter = c.orderTable.customer.country.name.eq('norway');	
	c.newQuery();
	
}

module.exports = act;