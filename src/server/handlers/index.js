/**
 * Handler index - exports all handlers
 */

const api = require('./api');
const pdf = require('./pdf');
const ats = require('./ats');
const static = require('./static');

module.exports = {
    // API handlers
    ...api,
    
    // PDF handlers
    ...pdf,
    
    // ATS handlers
    ...ats,
    
    // Static file handlers
    ...static
};
