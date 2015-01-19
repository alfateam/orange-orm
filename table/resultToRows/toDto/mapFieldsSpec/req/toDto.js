function act(c){	
	c.dto = {};
	c.strategy = {};
	c.table = {};

	c.aColumn = {};
	c.aColumn.alias = 'a';
	
	c.bColumn = {};
	c.bColumn.alias = 'b';
	c.bColumn.serializable = true;

	c.ignoredColumn = {};
	c.ignoredColumn.alias = 'ignored';
	c.ignoredColumn.serializable = false;
	
	c.table._columns = [c.aColumn, c.bColumn, c.ignoredColumn];
	c.row = { a: 'aval', b: 'bval', ignored: 'ignoredValue', someRelation : 'rel'}

	c.expected = { a: 'aval', b: 'bval'};
	                    
	c.returned = c.sut(c.strategy, c.table, c.row, c.dto);
}

module.exports = act;