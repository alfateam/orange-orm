function act(c){
	c.getChangeSet.expect().return([]);

	c.returned = c.sut(c.row);
}

module.exports = act;