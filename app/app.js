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
require('dotenv').config()

var MQTTCLIENT_ONLINE = false
let ts = () => new Date().toISOString()

const orbitClient = new Orbit()

const mqttClient = mqtt.connect(process.env.MQTT_BROKER_ADDRESS, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
  keepalive: 10000,
  connectTimeout: 120000,
  reconnectPeriod: 1000,
  clientId: 'bhyve-mqtt_' + Math.random().toString(16).substr(2, 8),
  will: {
    topic: "bhyve/online",
    payload: "false",
    qos: 0,
    retain: true
  }
})

const handleClientError = function (err) {
  console.error(`${ts()} - connection error to broker, exiting`)
  console.error('    ' + err)
  setTimeout(() => {
    process.exit()
  }, 10000)
}

mqttClient.on('error', handleClientError)

mqttClient.on('offline', function () {
  console.log(`${ts()} - BROKER OFFLINE`)
  MQTTCLIENT_ONLINE = false
})

mqttClient.on('message', (topic, message) => {
  // console.log('topic: ' + topic + ' message: ' + message.toString())
  try {
    parseMessage(topic, message)
  } catch (e) {
    console.log(`${ts()} parseMessage ERROR: JSONvalidate failed: `)
    console.log('    validation error: ' + e)
    console.log('    client message: ' + message.toString())
  }
})

// connect to orbitClient once mqtt is up:
mqttClient.on('connect', function () {
  console.log(`${ts()} - mqtt connected`)
  MQTTCLIENT_ONLINE = true
  orbitConnect()
})

const orbitConnect = () => {
  orbitClient.connect({
    email: process.env.ORBIT_EMAIL,
    password: process.env.ORBIT_PASSWORD
  })
}

// once we get a token, publish alive message
orbitClient.on('token', (token) => {
  if (MQTTCLIENT_ONLINE) mqttClient.publish('bhyve/alive', ts(), publishHandler)
  if (MQTTCLIENT_ONLINE) mqttClient.publish('bhyve/online', "true", { qos: 0, retain: true }, publishHandler)

  console.log(`${ts()} - Token: ${token}`)
})

orbitClient.on('user_id', (userId) => {
  console.log(`${ts()} - user_id: ${userId}`)
  orbitClient.devices()
})

orbitClient.on('device_id', (deviceId) => {
  console.log(`${ts()} - device_id: ${deviceId}`)
})

orbitClient.on('devices', (data) => {
  if (!MQTTCLIENT_ONLINE) return

  let devices = []
  subscribeHandler(`bhyve/device/refresh`)

  for (let prop in data) {
    if (!data.hasOwnProperty(prop)) continue

    let deviceId = data[prop].id
    devices.push(deviceId)
    console.log(`${ts()} - devices: ` + JSON.stringify(data[prop]))

    // Publish device status. If a current operation is underway watering_status will be an object
    // otherwise it will be empty / null
    let deviceStatus = []
    if (typeof data[prop].status.watering_status === 'object') deviceStatus = JSON.stringify(data[prop].status.watering_status)
    mqttClient.publish(`bhyve/device/${deviceId}/status`, deviceStatus)
    console.log(`${ts()} - status: ${deviceStatus}`)

    subscribeHandler(`bhyve/device/${deviceId}/refresh`)
    mqttClient.publish(`bhyve/device/${deviceId}/details`, JSON.stringify(data[prop]), { retain: true })

    // enumerate zones for device and publish
    for (let zone in data[prop].zones) {
      let station = data[prop].zones[zone].station
      
      subscribeHandler(`bhyve/device/${deviceId}/zone/${station}/set`)
      mqttClient.publish(`bhyve/device/${deviceId}/zone/${station}`, JSON.stringify(data[prop].zones[zone]))
    }

  }
  
  mqttClient.publish(`bhyve/devices`, JSON.stringify(devices))
  orbitClient.connectStream()
})

orbitClient.on('error', (err) => {
  console.log(`${ts()} - Orbit Error: ` + err)
})

orbitClient.on('message', (data) => {
  const json = JSON.stringify(data)
  console.log(`${ts()} - message: ` + json)
  let event = data.event
  if (MQTTCLIENT_ONLINE) {
    if (data.device_id) {
      mqttClient.publish(`bhyve/device/${data.device_id}/message`, json)
    } else {
      mqttClient.publish(`bhyve/message`, json) 
    }
  }
  console.log(`${ts()} - event: ` + event)
})

let publishHandler = function (err) {
  if (err) {
    return console.error(err)
  }
  // console.log(`${ts()} - mqtt publish`)
}

let subscribeHandler = function (topic) {
  console.log(`${ts()} - subscribe topic: ` + topic)
  mqttClient.subscribe(topic, (err, granted) => {
    if (err) {
      console.error(`mqttClient.subscribe ${topic} error:`)
      console.error('    ' + err)
    }
    console.log(`${ts()} - granted: ` + JSON.stringify(granted))
  })
}

const parseMessage = (topic, message) => {
  console.log(`${ts()} - parseMessage topic: ${topic}`)
  switch (topic) {
    // bhyve/device/{device_id}/zone/{station}/set
    case (topic.match(/bhyve\/device\/(.*)\/zone\/(\d)\/set/) || {}).input:
      let ajv = new Ajv()
      // validate JSON schema
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
      if (!CMD_VALID) throw new Error(JSON.stringify(JSONvalidate.errors))
      let myJSON = {}
      console.log(`${ts()} - deviceId: ` + deviceId + ' station: ' + station + ' command: ' + require('util').inspect(command))
      switch (command.state.toLowerCase()) {
        case 'on':
          myJSON = { 'event': 'change_mode', 'mode': 'manual', 'device_id': deviceId, 'timestamp': ts(), 'stations': [ { 'station': station, 'run_time': command.time } ] }
          break
        case 'off': default:
          myJSON = { 'event': 'change_mode', 'device_id': deviceId, 'timestamp': ts(), 'mode': 'manual', 'stations': [] }
          break
      }
      orbitClient.send(myJSON)
      console.log(`${ts()} - myJSON: ` + JSON.stringify(myJSON))
      break
    // bhyve/device/{device_id}/refresh
    // to do: refresh individual device instead of all
    // will require some work to orbit.js
    case (topic.match(/bhyve\/device\/(.*)\/refresh/) || {}).input:
    case 'bhyve/device/refresh':
      console.log(`${ts()} - refresh`)
      orbitClient.devices()
      break
    default:
      console.log(`${ts()} - default: ${topic}`)
      break
  }
}

const handleSignal = (signal) => {
  console.log(`${ts()} - event: ${signal}, shutting down`)
  if (mqttClient) mqttClient.end
  process.exit(1)
}

const signals = ['SIGTERM', 'SIGINT'];
signals.forEach((signal) =>
  process.on(signal, handleSignal)
)