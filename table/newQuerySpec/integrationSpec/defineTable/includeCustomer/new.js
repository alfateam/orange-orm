function act(c) {
	c.expected = 'select _0.oOrderId,_0.oCustomerId,_0_0.cCustomerId,_0_0.cName,_0_0.cCountryId from order _0' + 
	' JOIN customer _0_0 ON (_0.oCustomerId=_0_0.cCustomerId)';
	c.newQuery();	
}

act.base = '../includeCustomer';
module.exports = act;