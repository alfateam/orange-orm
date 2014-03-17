function act(c) {
	c.expected = "select _0.oOrderId,_0.oCustomerId from order _0 where EXISTS (SELECT _3.aId FROM article AS _3 " + 
		"INNER JOIN package _2 ON (_3.aId=_2.pArticleId) " + 
		"INNER JOIN orderLine _1 ON (_2.pLineId=_1.lId) " + 
		"WHERE _0.oOrderId=_1.lOrderId AND _3.aName='theArt') AND _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz'";

	c.filter = c.orderTable.lines.packages.article.name.eq('theArt');	
	c.newQuery();
	
}

module.exports = act;