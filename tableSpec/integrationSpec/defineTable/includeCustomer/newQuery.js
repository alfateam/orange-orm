function act(c) {
	c.expected = 'select _0.oOrderId,_0.oCustomerId,_0_0.cCustomerId,_0_0.cName,_0_0.cCountryId from order _0 ' +
				 'LEFT JOIN customer _0_0 ON (_0.oCustomerId=_0_0.cCustomerId) where _0.discriminatorColumn=\'foo\' AND _0.discriminatorColumn2=\'baz\'';
	c.newQuery();	
}

act.base = '../includeCustomer';
module.exports = act;