var mapFields = require('./mapFields');
var newSingleRelatedToDto = require('./newSingleRelatedToDto');
var newManyRelatedToDto = require('./newManyRelatedToDto');
var all = require('../../promise').all;
var extractDto = require('./newToDto/extractDto');
var resultToPromise = require('../../resultToPromise');

function newToDto(strategy, table, dto) {
	dto = extractDto.apply(null, arguments);
    
    function toDto(row) {	
    	if (!row)     {
    		return resultToPromise(null);
    	}
		var dtoPromise = resultToPromise(dto);	
        var relations = table._relations;
        mapFields(strategy, table, row, dto);
        var visitor = {},
        	promises = [],
        	newRelatedToDto;

        visitor.visitJoin = function(relation) {
            newRelatedToDto = newSingleRelatedToDto;
        };

        visitor.visitMany = function(relation) {
            newRelatedToDto = newManyRelatedToDto;
        };

        visitor.visitOne = visitor.visitJoin;

        for (var relationName in strategy) {
            var relation = relations[relationName];
            relation.accept(visitor);
            var relatedToDto = newRelatedToDto(relationName, relation, strategy, dto);
            var promise = row[relationName].then(relatedToDto);
            promises.push(promise);
        }
        return all(promises).then(dtoPromise);
    }

    return toDto;
};

module.exports = newToDto;