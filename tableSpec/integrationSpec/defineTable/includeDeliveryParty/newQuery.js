function act(c) {
	c.expected = "select _0.oOrderId as s_00,_0.oCustomerId as s_01,_0_0.dId as s_0_00,_0_0.dOrderId as s_0_01 from order _0 LEFT JOIN deliveryParty _0_0 ON (_0.oOrderId=_0_0.dOrderId) where _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz' order by _0.oOrderId";
	c.newQuery();	
}

module.exports = act;