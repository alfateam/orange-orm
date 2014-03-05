var nextResultToRows = _nextResultToRows;
var dbRowsToRows = require('./resultToRows/dbRowsToRows');

function resultToRows(span,result) {
	dbRowsToRows(span,result);
	result.shift();
	
	var c2 = {};
	c2.visitJoin = function() {};
	c2.visitOne = function() {};
	c2.visitMany = function(leg) {		
		nextResultToRows(leg.span,result);
	};
	
	function onEachLeg(leg) {			
		leg.accept(c2);
	}
	span.legs.forEach(onEachLeg);	
}

function _nextResultToRows(span,result) {
	nextResultToRows = require('./resultToRows');
	nextResultToRows(span,result);
}

module.exports = resultToRows;