var newUpdateCommandCore = require('./newUpdateCommandCore');
var newImmutable = require('../../newImmutable');
var newColumnList = require('../../newObject');

function newUpdateCommand(table, column, row) {
	var c = {};
	var _getCoreCommand = newImmutable(newUpdateCommandCore);
  var columnList = newColumnList();
  columnList[column.alias] = column;
  row.subscribeChanged(onFieldChanged);

  function onFieldChanged(row, column) {
    console.log(column.alias);
    columnList[column.alias] = column;
  }

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
    	return _getCoreCommand(table, columnList, row);
    }

    c.endEdit = function() {
      getCoreCommand();
      row.unsubscribeChanged(onFieldChanged);
    };
    
    c.matches = function(otherRow) {
      return row == otherRow;
    };

	return c;
}

module.exports = newUpdateCommand;