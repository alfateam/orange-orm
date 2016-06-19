function act(c){
	c.changeSet.length = 2;
	c.changeSet.batchSize = 1;
	c.changeSet.queryCount = 10;
	c.changeSet.prevQueryCount = 2;
	c.flush.expect();
	c.sut();
}

module.exports = act;