function act(c){
	c.strategy.customer = {country: null};
}

act.base = '../includeCustomer';
module.exports = act;