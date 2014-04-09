function newInsertCommand(table, row) {
	var c = {};

	c.sql = function() {

	};

	c.parameters = 'foo';

	return c;
}

module.exports = newInsertCommand;