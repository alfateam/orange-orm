function act(c){
	c.lastChange = {};
	c.lastChange.matches = c.mock();
	c.changeSet = [c.lastChange];
	c.getChangeSet.expect().return(c.changeSet);
}

module.exports = act;