function act(c){		
	c.changes = [{sql: {}}];
	c.sut(c.changes);
}

module.exports = act;