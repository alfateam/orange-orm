function act(c) {
    c.table._insertTemplate = {};
    c.returned = c.sut(c.table);
}

module.exports = act;