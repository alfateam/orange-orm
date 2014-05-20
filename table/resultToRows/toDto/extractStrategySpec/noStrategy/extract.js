function act(c) {
    c.oneRelation = {};
    c.oneChildTable = {};
    c.oneRelation.childTable = c.oneChildTable;

    c.manyRelation = {};
    c.manyChildTable = {};
    c.manyRelation.childTable = c.manyChildTable;

    c.joinRelation = {};

    c.table._relations = {
        one: c.oneRelation,
        many: c.manyRelation,
        join: c.joinRelation
    };

    c.oneRelation.accept = function(visitor) {
        visitor.visitOne(c.oneRelation);
    }
    c.manyRelation.accept = function(visitor) {
        visitor.visitMany(c.manyRelation);
    }

    c.joinRelation.accept = function(visitor) {
        visitor.visitJoin(c.joinRelation);
    }

    c.oneChildStrategy = '<oneChildStrategy>';
    c.manyChildStrategy = '<manyChildStrategy>';
    c.extractStrategy = c.requireMock('./extractStrategy');
    c.extractStrategy.expect(c.oneChildTable).return(c.oneChildStrategy);
    c.extractStrategy.expect(c.manyChildTable).return(c.manyChildStrategy);

    c.expected = {one: c.oneChildStrategy, many: c.manyChildStrategy};

    c.returned = c.sut(c.table);
}

module.exports = act;