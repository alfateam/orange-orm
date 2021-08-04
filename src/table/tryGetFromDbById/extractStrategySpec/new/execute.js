var	strategy = {};

function act(c) {
	c.strategy = strategy;	
	c.returned = c.sut(c.table,c.arg1,c.arg2,strategy);
}

act.base = '../new';
module.exports = act;