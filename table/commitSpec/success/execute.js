function act(c) {    
    c.domainExit = {
        promise: {},
        resolve: c.mock()
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
    c.releaseDbClient.expect(c.changesResult).return(c.releaseResult);

    c.domainExit.resolve.expect(c.releaseResult);

    c.returned = c.sut();
}


module.exports = act;
