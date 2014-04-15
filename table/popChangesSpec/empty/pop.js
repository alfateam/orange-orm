function act(c){
	c.changeSet = [];
	c.getChangeSet.expect().return(c.changeSet);
	c.returned = c.sut();
}

module.exports = act;