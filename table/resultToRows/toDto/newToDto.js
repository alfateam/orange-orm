var mapFields = require('./mapFields');
var newSingleRelatedToDto = require('./newSingleRelatedToDto');
var newManyRelatedToDto = require('./newManyRelatedToDto');
var all = require('../../promise').all;
var extractDto = require('./newToDto/extractDto');
var resultToPromise = require('../../resultToPromise');

function newToDto(strategy, table, dto) {
    var args = arguments;
    function toDto(row) {
        if (!row) {
            return resultToPromise(null);
        }
        var dto = extractDto.apply(null, args);
        var relations = table._relations;
        mapFields(strategy, table, row, dto);
        
        var promise = resultToPromise(null);
        for (var relationName in strategy) {
            var map = mapRelation.bind(null,relationName);
            promise = promise.then(map);              
        }

        function mapRelation(relationName) {
            var relation = relations[relationName];             
            var visitor = {};
            var promise;
            visitor.visitJoin = function() {
                var relatedToDto = newSingleRelatedToDto(relationName, relation, strategy, dto);
                promise = row[relationName].then(relatedToDto);
            };

            visitor.visitMany = function() {
                var relatedToDto = newManyRelatedToDto(relationName, relation, strategy, dto);
                promise = row[relationName].then(relatedToDto);
            };

            visitor.visitOne = visitor.visitJoin;            
            relation.accept(visitor);           
            return promise;
        }

        return promise.then(function() {return dto;});
    }

    return toDto;
};

module.exports = newToDto;