var mixin = require('../mixin');

var core = module.exports = {
    Ros: require('./Ros'),
    Topic: require('./Topic'),
    Message: require('./Message'),
    Param: require('./Param'),
    Service: require('./Service'),
    ServiceRequest: require('./ServiceRequest'),
    ServiceResponse: require('./ServiceResponse'),
    Action: require('./Action'),
    ActionGoal: require('./ActionGoal'),
    ActionFeedback: require('./ActionFeedback'),
    ActionResult: require('./ActionResult'),
};

mixin(core.Ros, ['Param', 'Service', 'Topic', 'Action'], core);
