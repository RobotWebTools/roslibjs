import React, { useState } from 'react'
import ROSLIB from 'roslib'

function SendMessage() {
  const [status, setStatus] = useState("Not connected")
  const [linear, setLinear] = useState({ x: 0, y: 0, z: 0 })
  const [angular, setAngular] = useState({ x: 0, y: 0, z: 0 })
  const ros = new ROSLIB.Ros({encoding: 'ascii'})

  function convert(input){
        if (input.charAt(0) === "-") {
            let x = input.slice(0)
            return parseInt(x)
          } else {
                return parseInt(input)
          }
        }

    function connect() {
      ros.connect("ws://localhost:9090")
      // won't let the user connect more than once
      ros.on('error', function (error) {
        console.log(error)
        setStatus(error)
      })

      // Find out exactly when we made a connection.
      ros.on('connection', function () {
        console.log('Connected!')
        setStatus("Connected!")
      })

      ros.on('close', function () {
        console.log('Connection closed')
        setStatus("Connection closed")
      })
  }

  function publish() {
    if (status !== 'Connected!') {
      connect()
    }
    const cmdVel = new ROSLIB.Topic({
      ros: ros,
      name: "pose_topic",
      messageType: "geometry_msgs/Pose2D"
    })

    const data = new ROSLIB.Message({
            x : linear.x,
            y : linear.y,
            theta : angular.z
    })

    // publishes to the queue
    console.log('msg', data)
    cmdVel.publish(data)
  }

  return (
  <div>
    <div>
      {status}
    </div>
    <p>Send a message to turtle</p>
    <p>Linear:</p>
    <label>X</label>
    <input name={"linear"} type={"number"} value={linear.x} onChange={(ev) => setLinear({...linear, x: convert(ev.target.value)})}/>
    <label>Y</label>
    <input name={"linear"} type={"number"} value={linear.y} onChange={(ev) => setLinear({...linear, y: convert(ev.target.value)})}/>
    <label>Z</label>
    <input name={"linear"} type={"number"} value={linear.z} onChange={(ev) => setLinear({...linear, z: convert(ev.target.value)})}/>
    <p>Angular:</p>
    <label>X</label>
    <input name={"angular"} type={"number"} value={angular.x} onChange={(ev) => setAngular({...angular, x: convert(ev.target.value)})}/>
    <label>Y</label>
    <input name={"angular"} type={"number"} value={angular.y} onChange={(ev) => setAngular({...angular, y: convert(ev.target.value)})}/>
    <label>Z</label>
    <input name={"angular"} type={"number"} value={angular.z} onChange={(ev) => setAngular({...angular, z: convert(ev.target.value)})}/>
    <br />
    <button onClick={() => publish()}>Publish</button>
        <br/>
  </div>
  )
}

export default SendMessage
