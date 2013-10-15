var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var expectRequire = a.expectRequire;

function act(c){
	var table = {};
	var alias = 'alias';

	var formuladisc1 = '@thisformulaDisc1';
	var formuladisc2 = '@thisformulaDisc2';

	var columnDisc1 = 'columnDisc1';
	var columnDisc2 = 'columnDisc2';

	table.formulaDiscriminators = [formuladisc1, formuladisc2];
	table.columnDiscriminators = [columnDisc1, columnDisc2];

	c.expected = '(aliasformulaDisc1) AND (aliasformulaDisc2) AND alias.columnDisc1 AND alias.columnDisc2';

	c.returned = require('../newDiscriminatorSql')(table, alias);
}

module.exports = act;