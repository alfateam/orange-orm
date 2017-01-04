function act(c) {
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order where EXISTS (SELECT _1.cCustomerId FROM customer AS _1 WHERE order.oCustomerId=_1.cCustomerId AND _1.cName='lars') AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oOrderId";
	c.filter = c.orderTable.customer.name.eq('lars');	
	c.newQuery();
	
}

module.exports = act;