function act(c) {
	c.expected = 'select _0.oOrderId,_0.oCustomerId from order _0 where _0.discriminatorColumn=\'foo\' AND _0.discriminatorColumn2=\'baz\';' +
 				 'select _0_0.lId,_0_0.lLineNo,_0_0.lOrderId from orderLine _0_0 ' +
				 'INNER JOIN order _0 ON (_0_0.lOrderId=_0.oOrderId AND _0.discriminatorColumn=\'foo\' AND _0.discriminatorColumn2=\'baz\');' +
				 'select _0_0_0.pId,_0_0_0.pLineId from package _0_0_0 ' +
				 'INNER JOIN orderLine _0_0 ON (_0_0_0.pLineId=_0_0.lId) ' +
				 'INNER JOIN order _0 ON (_0_0.lOrderId=_0.oOrderId AND _0.discriminatorColumn=\'foo\' AND _0.discriminatorColumn2=\'baz\')';
	c.newQuery();	
}

act.base = '../includePackages';
module.exports = act;