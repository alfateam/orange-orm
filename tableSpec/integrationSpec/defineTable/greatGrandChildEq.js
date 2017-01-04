function act(c) {
	c.expected = "select order.oOrderId as sorder0,order.oCustomerId as sorder1 from order order where EXISTS (SELECT _3.aId FROM article AS _3 INNER JOIN package _2 ON (_3.aId=_2.pArticleId) INNER JOIN orderLine _1 ON (_2.pLineId=_1.lId) WHERE order.oOrderId=_1.lOrderId AND _3.aName='theArt') AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz' order by order.oOrderId";

	c.filter = c.orderTable.lines.packages.article.name.eq('theArt');	
	c.newQuery();
	
}

module.exports = act;