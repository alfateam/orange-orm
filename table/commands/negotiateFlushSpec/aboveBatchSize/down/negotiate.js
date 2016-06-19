function act(c){
	c.changeSet.length = 14;
	c.changeSet.batchSize = 8;
	c.changeSet.queryCount = 2;
	c.changeSet.prevQueryCount = 10;
	c.flush.expect();
	c.sut();
}

module.exports = act;