var legToQuery = require('./joinLegToQuery');
var getRelativesCore = require('../getRelativesCore');

module.exports = getRelativesCore.bind(null, legToQuery);