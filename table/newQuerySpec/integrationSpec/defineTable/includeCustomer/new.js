function act(c) {
	c.expected =  'select _0.id,_0.invoicedCustomerId,_0_0.customerId from order _0 JOIN customer _0_0 ON (_0.invoicedCustomerId=_0_0.customerId)';	
	c.newQuery();
}

act.base = '../includeCustomer';
module.exports = act;