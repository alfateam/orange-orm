var newInsertCommandCore = require('./newInsertCommandCore');
var newImmutable = require('../../newImmutable');

function newInsertCommand(table, row) {
	var c = {};
	var _getCoreCommand = newImmutable(newInsertCommandCore);

	c.sql = function() {
		return getCoreCommand().sql();
	};

	Object.defineProperty(c, 'parameters', {
        get : function() {
      			return getCoreCommand().parameters;   	
      		}	 
         }
    );

    function getCoreCommand() {
    	return _getCoreCommand(table, row);
    }

    c.endEdit = c.sql;
    
    c.matches = function(otherRow) {
      return row == otherRow;
    };

	return c;
}

module.exports = newInsertCommand;