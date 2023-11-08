var expect = require('chai').expect;
var ROSLIB = require('../..');

describe('Fibonacci Example', function() {
    it('Fibonacci', function(done) {
        this.timeout(8000);

        var ros = new ROSLIB.Ros({
            url: 'ws://localhost:9090'
        });
        // The ActionClient
        // ----------------

        var fibonacciClient = new ROSLIB.ActionClient({
            ros: ros,
            serverName: '/fibonacci',
            actionName: 'actionlib_tutorials/FibonacciAction'
        });

        // Create a goal.
        var goal = new ROSLIB.Goal({
            actionClient: fibonacciClient,
            goalMessage: {
                order: 7
            }
        });

        // Print out their output into the terminal.
        var items = [
            {'sequence': [0, 1, 1]},
            {'sequence': [0, 1, 1, 2]},
            {'sequence': [0, 1, 1, 2, 3]},
            {'sequence': [0, 1, 1, 2, 3, 5]},
            {'sequence': [0, 1, 1, 2, 3, 5, 8]},
            {'sequence': [0, 1, 1, 2, 3, 5, 8, 13]},
            {'sequence': [0, 1, 1, 2, 3, 5, 8, 13, 21]}
        ];
        goal.on('feedback', function(feedback) {
            console.log('Feedback:', feedback);
            expect(feedback).to.eql(items.shift());
        });
        goal.on('result', function(result) {
            console.log('Result:', result);
            expect(result).to.eql({'sequence': [0, 1, 1, 2, 3, 5, 8, 13, 21]});
            done();
        });

        // Send the goal to the action server.
        // The timeout is to allow rosbridge to properly subscribe all the
        // Action topics - otherwise, the first feedback message might get lost
        setTimeout(function(){
          goal.send();
        }, 100);
    });
});