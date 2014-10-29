function act(c) {
	c.expected = "select _0.oOrderId as s_00,_0.oCustomerId as s_01,_0_0.cCustomerId as s_0_00,_0_0.cName as s_0_01,_0_0.cCountryId as s_0_02 from order _0 LEFT JOIN customer _0_0 ON (_0.oCustomerId=_0_0.cCustomerId) where _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz'"
	c.newQuery();	
}

act.base = '../includeCustomer';
module.exports = act;