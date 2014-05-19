function act(c){	
	c.dto = {};
	c.strategy = {};
	c.table = {};
	c.aColumn = {};
	c.aColumn.alias = 'a';
	c.bColumn = {};
	c.bColumn.alias = 'b';
	c.table._columns = [c.aColumn, c.bColumn];
	c.row = { a: 'aval', b: 'bval', someRelation : 'rel'}
	c.someIntegerValue = {};
	c.someDateValue = new Date()
	c.expected = { a: 'aval', b: 'bval'};
	                    
	c.returned = c.sut(c.strategy, c.table, c.row, c.dto);
}

module.exports = act;