var a = require('a');

function act(c) {
    c.returned = c.sut();
}

module.exports = act;
