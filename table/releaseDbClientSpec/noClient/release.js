function act(c) {
    c.getSessionSingleton.expect('dbClientDone').return();

    try {
        c.sut();
    } catch (e) {
        c.didThrow = true;
    }

}

module.exports = act;
