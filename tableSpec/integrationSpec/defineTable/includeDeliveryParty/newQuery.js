function act(c) {
	c.expected = 'select _0.oOrderId,_0.oCustomerId,_0_0.dId,_0_0.dOrderId from order _0 ' +
				 'LEFT JOIN deliveryParty _0_0 ON (_0.oOrderId=_0_0.dOrderId) where _0.discriminatorColumn=\'foo\' AND _0.discriminatorColumn2=\'baz\'';
	c.newQuery();	
}

module.exports = act;