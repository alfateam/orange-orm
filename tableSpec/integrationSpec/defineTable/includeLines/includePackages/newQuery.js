function act(c) {

	c.expected = 'select _0.oOrderId as s_00,_0.oCustomerId as s_01 from order _0 where _0.discriminatorColumn=\'foo\' AND _0.discriminatorColumn2=\'baz\'';
 	c.expected2 = "select _0_0.lId as s_0_00,_0_0.lLineNo as s_0_01,_0_0.lOrderId as s_0_02 from orderLine _0_0 INNER JOIN order _0 ON (_0_0.lOrderId=_0.oOrderId AND _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz')";
	c.expected3 = "select _0_0_0.pId as s_0_0_00,_0_0_0.pLineId as s_0_0_01,_0_0_0.pArticleId as s_0_0_02 from package _0_0_0 INNER JOIN orderLine _0_0 ON (_0_0_0.pLineId=_0_0.lId) INNER JOIN order _0 ON (_0_0.lOrderId=_0.oOrderId AND _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz')";
	c.newQuery();	
}

module.exports = act;