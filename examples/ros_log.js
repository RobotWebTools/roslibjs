/**
 * Implements ROS logging capability with functions
 * that are called similarly to the python logging functions.
 * 
 * This script must be imported after ROSLIB.ros() has been created
 * and a ROS connection has been established.
 * 
 * @author Joshua Glazer - github.com/vashmata
 */



// ROS logging severity level constants
const ROSDEBUG = 1 // debug level
const ROSINFO = 2  // general level
const ROSWARN = 4  // warning level
const ROSERROR = 8 // error level
const ROSFATAL = 16 // fatal/critical level

// create a publisher to send log messages to /rosout
ros_logger = new ROSLIB.Topic({
ros: ros,
name: 'rosout',
messageType: 'rosgraph_msgs/Log'
})

/**
 * Gets the current time and formats it for ROS and the console.
 * @return array of two variables: ROS time object, string containing hh:mm:ss
*/
function rosTimestamp () {
  // next few lines taken and adjusted from roslibjs action server example
  let currentTime = new Date()
  let secs = currentTime.getTime()/1000 // seconds before truncating the decimal
  let secsFloored = Math.floor(secs) // seconds after truncating
  let nanoSecs = Math.round(1000000000*(secs-secsFloored)) // nanoseconds since the previous second

  // return a dictionary for the ROS log and a string for the console
  let stampTime = currentTime.toString().split(' ')[4] // hh:mm:ss from date object
  return [{secs : secsFloored, nsecs : nanoSecs}, stampTime]
}

/**
 * Creates and publishes a ROS log message to /rosout based on the parameters
 * @param logLevel one of the ROS loglevel constants defined above
 * @param timestamp ros time object containing seconds and nanoseconds
 * @param message the log message
*/
function publishRosLog (logLevel, timestamp, message) {
  ros_logger.publish(
    new ROSLIB.Message({
      // I'm only publishing the essentials. We could include more info if so desired
      header : {
        // seq // uint32: sequence ID, seems to increment automatically
        stamp : timestamp // dictionary: contains truncated seconds and nanoseconds
        // frame_id // string: probably only useful for tf
      },
      level : logLevel, // int: see log level constants above
      // name : '/web_gui', // name of the node (proposed)
      msg : message, // string: this is the log message
      // file // string: we could specify the js file that generated the log
      // function // string: we could specify the parent function that generated the log
      // line // uint32: we could specify the specific line of code that generated the log
      // topics // string[]: topic names that the node publishes
    })
  )
}

/**
 * Publishes the log message and prints it to the chrome console.
 * @param logLevel one of the ROS loglevel constants defined above
 * @param message the log message
*/
function rosLog (logLevel, message) {
  logData = {}
  logData[ROSDEBUG] = {prefix : '[DEBUG]', type : 'log'}
  logData[ROSINFO] = {prefix : '[INFO]', type : 'log'}
  logData[ROSWARN] = {prefix : '[WARN]', type : 'warn'}
  logData[ROSERROR] = {prefix : '[ERROR]', type : 'error'}
  logData[ROSFATAL] = {prefix : '[FATAL]', type : 'error'}

  stamps = rosTimestamp()
  consoleMsg = logData[logLevel].prefix + ' [' + stamps[1] + ']: ' + message

  if (logData[logLevel].type === 'log') {
    console.log(consoleMsg)
  } else if (logData[logLevel].type === 'warn') {
    console.warn(consoleMsg)
  } else if (logData[logLevel].type === 'error') {
    console.error(consoleMsg)
  }

  // log messages go to log file: currently rosout.log
  publishRosLog(logLevel, stamps[0], message)
}


// these functions mimic the rospy logging functions

/**
 * Sends a debug message with timestamp to the GUI and chrome consoles.
 * Also publishes it to /rosout.
 * @param message the log message
*/
function logDebug (message) {
  // unlike rospy, (currently) the debug messages we generate will get published
  rosLog(ROSDEBUG, message)
}

/**
 * Sends an info message with timestamp to the GUI and chrome consoles.
 * Also publishes it to /rosout.
 * @param message the log message
*/
function logInfo (message) {
  rosLog(ROSINFO, message)
}

/**
 * Sends a warning message with timestamp to the GUI and chrome consoles.
 * Also publishes it to /rosout.
 * @param message the log message
*/
function logWarn (message) {
  rosLog(ROSWARN, message)
}

/**
 * Sends an error message with timestamp to the GUI and chrome consoles.
 * Also publishes it to /rosout.
 * @param message the log message
*/
function logErr (message) {
  rosLog(ROSERROR, message)
}

/**
 * Sends a fatal error message with timestamp to the GUI and chrome consoles.
 * Also publishes it to /rosout.
 * @param message the log message
*/
function logFatal (message) {
  rosLog(ROSFATAL, message)
}