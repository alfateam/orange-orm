function act(c) {
	c.expected = "select _0.oOrderId,_0.oCustomerId from order _0 where EXISTS (SELECT _1.cCustomerId FROM customer AS _1 WHERE _0.oCustomerId=_1.cCustomerId AND _1.cName='lars') AND _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz'";
	c.filter = c.orderTable.customer.name.eq('lars');	
	c.newQuery();
	
}

module.exports = act;