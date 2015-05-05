function act(c) {
	c.expected = "select _0.oOrderId as s_00,_0.oCustomerId as s_01,_0_0.cCustomerId as s_0_00,_0_0.cName as s_0_01,_0_0.cCountryId as s_0_02,_0_0_0.yCountryId as s_0_0_00,_0_0_0.yCountryName as s_0_0_01 from order _0 LEFT JOIN customer _0_0 ON (_0.oCustomerId=_0_0.cCustomerId) LEFT JOIN country _0_0_0 ON (_0_0.cCountryId=_0_0_0.yCountryId) where _0.discriminatorColumn='foo' AND _0.discriminatorColumn2='baz' order by _0.oOrderId";

	c.newQuery();	
}

module.exports = act;