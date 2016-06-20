var a = require('a');

function act(c) {
    c.context.flushing = {
        then: function(nextFlush) {
            c.didWaitForPreviousFlush = true;
            if (nextFlush)
                return nextFlush();
        }
    };

    c.returned = c.sut();
}

module.exports = act;
