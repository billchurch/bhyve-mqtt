'use strict'
/*
 * app.js
 *
 * unofficial Orbit Bhyve API to MQTT gateway
 * Bill Church - https://github.com/billchurch/bhyve-mqtt
 *
 */
const Ajv = require('ajv')
const Orbit = require('./orbit')
const mqtt = require('mqtt')

var MCLIENT_ONLINE = false
let ts = () => new Date().toISOString()

const oClient = new Orbit()

const mClient = mqtt.connect(process.env.MQTT_BROKER_ADDRESS, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
  keepalive: 10000,
  connectTimeout: 120000,
  reconnectPeriod: 500,
  clientId: 'bhyve-mqtt_' + Math.random().toString(16).substr(2, 8)
})

const handleClientError = function (err) {
  console.error(`${ts()} - connection error to broker, exiting`)
  console.error('    ' + err)
  setTimeout(() => {
    process.exit()
  }, 10000)
}

mClient.on('error', handleClientError)

mClient.on('offline', function () {
  console.log(`${ts()} - BROKER OFFLINE`)
  MCLIENT_ONLINE = false
})

let publishHandler = function (err) {
  if (err) {
    return console.error(err)
  }
  // console.log(`${ts()} - mqtt publish`)
}

// connect to oClient once mqtt is up:
mClient.on('connect', function () {
  console.log(`${ts()} - mqtt connected`)
  MCLIENT_ONLINE = true
  oClient.connect({
    email: process.env.ORBIT_EMAIL,
    password: process.env.ORBIT_PASSWORD
  })
})

// once we get a token, publish alive message
oClient.on('token', (token) => {
  if (MCLIENT_ONLINE) mClient.publish('bhyve/alive', ts(), publishHandler)
  console.log(`${ts()} - Token: ${token}`)
})

oClient.on('user_id', (userId) => {
  console.log(`${ts()} - user_id: ${userId}`)
  oClient.devices()
})

oClient.on('device_id', (deviceId) => {
  console.log(`${ts()} - device_id: ${deviceId}`)
})

let subscribeHandler = function (topic) {
  console.log(`${ts()} - subscribe topic: ` + topic)
  mClient.subscribe(topic, (err, granted) => {
    if (err) {
      console.error(`mClient.subscribe ${topic} error:`)
      console.error('    ' + err)
    }
    console.log(`${ts()} - granted: ` + JSON.stringify(granted))
  })
}

oClient.on('devices', (data) => {
  if (MCLIENT_ONLINE) {
    let devices = []
    subscribeHandler(`bhyve/device/refresh`)
    for (let prop in data) {
      if (data.hasOwnProperty(prop)) {
        let deviceId = data[prop].id
        devices.push(deviceId)
        console.log(`${ts()} - devices: ` + JSON.stringify(data[prop]))
        if (typeof data[prop].status.watering_status === 'object') {
          mClient.publish(`bhyve/device/${deviceId}/status`, JSON.stringify(data[prop].status.watering_status))
        } else {
          mClient.publish(`bhyve/device/${deviceId}/status`, null)
        }
        console.log(`${ts()} - status: ` + JSON.stringify(data[prop].status.watering_status))
        subscribeHandler(`bhyve/device/${deviceId}/refresh`)
        mClient.publish(`bhyve/device/${deviceId}/details`, JSON.stringify(data[prop]), { retain: true })
        for (let zone in data[prop].zones) {
          let station = data[prop].zones[zone].station
          mClient.publish(`bhyve/device/${deviceId}/zone/${station}`, JSON.stringify(data[prop].zones[zone]))
          subscribeHandler(`bhyve/device/${deviceId}/zone/${station}/set`)
        }
      }
    }
    mClient.publish(`bhyve/devices`, JSON.stringify(devices))

    oClient.connectStream()
  }
})

const parseMessage = (topic, message) => {
  console.log(`${ts()} - parseMessage topic: ${topic}`)
  switch (topic) {
    // bhyve/device/{device_id}/zone/{station}/set
    case (topic.match(/bhyve\/device\/(.*)\/zone\/(\d)\/set/) || {}).input:
      let ajv = new Ajv()
      const cmdSchema = {
        'if': { 'properties': { 'state': { 'enum': ['ON', 'on'] } } },
        'then': { 'required': ['time'] },
        'properties': {
          'time': {
            'type': 'number',
            'minimum': 1,
            'maximum': 999
          },
          'state': {
            'type': 'string',
            'enum': ['ON', 'OFF', 'on', 'off']
          }
        }
      }
      let JSONvalidate = ajv.compile(cmdSchema)
      const found = topic.match(/bhyve\/device\/(.*)\/zone\/(\d)\/set/)
      const deviceId = found[1]
      const station = Number(found[2])
      const command = JSON.parse(message.toString())
      let CMD_VALID = JSONvalidate(command)
      if (!CMD_VALID) {
        throw new Error(JSON.stringify(JSONvalidate.errors))
      }
      let myJSON = {}
      console.log(`${ts()} - deviceId: ` + deviceId + ' station: ' + station + ' command: ' + require('util').inspect(command))
      switch (command.state.toLowerCase()) {
        case 'on':
          console.log(`${ts()} - in on`)
          myJSON = { 'event': 'change_mode', 'mode': 'manual', 'device_id': deviceId, 'timestamp': ts(), 'stations': [ { 'station': station, 'run_time': command.time } ] }
          break
        case 'off':
          console.log(`${ts()} - in off`)
          myJSON = { 'event': 'change_mode', 'device_id': deviceId, 'timestamp': ts(), 'mode': 'manual', 'stations': [] }
          break
        default:
          console.log(`${ts()} - in default`)
          myJSON = { 'event': 'change_mode', 'device_id': deviceId, 'timestamp': ts(), 'mode': 'manual', 'stations': [] }
          break
      }
      oClient.send(myJSON)
      console.log(`${ts()} - myJSON: ` + JSON.stringify(myJSON))
      break
    // bhyve/device/{device_id}/refresh
    // to do: refresh individual device instead of all
    // will require some work to orbit.js
    case (topic.match(/bhyve\/device\/(.*)\/refresh/) || {}).input:
    case 'bhyve/device/refresh':
      console.log(`${ts()} - refresh`)
      oClient.devices()
      break
    default:
      console.log(`${ts()} - default: ${topic}`)
      break
  }
}

mClient.on('message', (topic, message) => {
  // console.log('topic: ' + topic + ' message: ' + message.toString())
  try {
    parseMessage(topic, message)
  } catch (e) {
    console.log(`${ts()} parseMessage ERROR: JSONvalidate failed: `)
    console.log('    validation error: ' + e)
    console.log('    client message: ' + message.toString())
  }
})

oClient.on('error', (err) => {
  console.log(`${ts()} - Orbit Error: ` + err)
})

const parseMode = (data) => {
  let mode = data.mode
  // let program = data.program
  let stations = data.stations
  // let deviceID = data.device_id

  for (let station in stations) {
    console.log(`${ts()} - station: ` + data.stations[station].station + ' mode: ' + mode + ' run_time: ' + data.stations[station].run_time)
  }
}

oClient.on('message', (data) => {
  const json = JSON.stringify(data)
  console.log(`${ts()} - message: ` + json)
  let event = data.event
  if (MCLIENT_ONLINE) {
    if (data.device_id) {
      mClient.publish(`bhyve/device/${data.device_id}/message`, json)
    } else {
      mClient.publish(`bhyve/message`, json) 
    }
  }
  console.log(`${ts()} - event: ` + event)

  switch (event) {
    case 'change_mode':

      parseMode(data)
      break
      //    case 'watering_in_progress_notification':
      //      break

    default:

      console.log(`${ts()} - message: ` + JSON.stringify(data))
  }
})
