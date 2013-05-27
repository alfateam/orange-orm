var strategy = {};

function act(c) {
	c.strategy = strategy;
	c.returned = c.sut(c.table,c.id1,c.id2,strategy);
}

act.base = '../../new';
module.exports = act;