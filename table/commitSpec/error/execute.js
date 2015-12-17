function act(c) {    
    c.domainExit = {
        promise: {},
        rejectInActiveDomain: c.mock()
    };
    c.getSessionSingleton.expect('domainExit').return(c.domainExit);

    c.changes = {};
    c.pushCommand.expect(c.commitCommand);
    c.popChanges.expect().return(c.changes);
    
    c.changesPromise = c.then();
    c.changesResult = {};    
    c.changesPromise.resolve(c.changesResult);
    c.executeChanges.expect(c.changes).return(c.changesPromise);

    c.releaseResult = {};
    c.error = new Error();
    c.releaseDbClient.expect(c.changesResult).throw(c.error);

    c.domainExit.rejectInActiveDomain.expect(c.error);

    c.returned = c.sut();
}


module.exports = act;
