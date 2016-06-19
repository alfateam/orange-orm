function act(c){
	c.changeSet.length = 1;
	c.changeSet.batchSize = 8;
	c.sut();
}

module.exports = act;