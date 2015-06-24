var arg = {};

function act(c){
	c.expected = {};
	c.iEqual.expect(c.column,arg,c.alias).return(c.expected);
	c.returned = c.column.iEqual(arg,c.optionalAlias);
}

module.exports = act;