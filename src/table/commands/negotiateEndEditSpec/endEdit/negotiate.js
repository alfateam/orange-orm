function act(c) {
    c.previousCommand = {
        sql: {},
        endEdit: {}
    };
    c.lastCommand = {
        sql: {},
        endEdit: c.mock()
    };
    c.lastCommand.endEdit.expect();
    c.changes = [c.previousCommand, c.lastCommand];
    c.sut(c.changes);
}

module.exports = act;
