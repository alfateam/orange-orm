function act(c){
	c.lastChange = {};
	c.changeSet = [c.lastChange];
	c.getChangeSet.expect().return(c.changeSet);
}

module.exports = act;