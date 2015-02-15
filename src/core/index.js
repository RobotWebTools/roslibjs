var mixin = require('../mixin');

var core = module.exports = {
    Ros: require('./Ros'),
    Topic: require('./Topic'),
    Message: require('./Message'),
    Param: require('./Param'),
    Service: require('./Service'),
    ServiceRequest: require('./ServiceRequest'),
    ServiceResponse: require('./ServiceResponse')
};

mixin(core.Ros, ['Param', 'Service', 'Topic'], core);
