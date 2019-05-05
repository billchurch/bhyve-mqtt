'use strict'
/*
 * app.js
 *
 * unofficial Orbit Bhyve API to MQTT gateway
 * Bill Church - https://github.com/billchurch/bhyve-mqtt
 *
 */
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
  reconnectPeriod: 500
})

const handleClientError = function (err) {
  console.error('connection error to broker, exiting')
  console.error(err)
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

oClient.on('devices', (data) => {
  if (MCLIENT_ONLINE) {
    let devices = []

    for (let prop in data) {
      if (data.hasOwnProperty(prop)) {
        let deviceId = data[prop].id
        devices.push(deviceId)
        console.log(`${ts()} - devices: ` + JSON.stringify(data[prop]))
        if (typeof data[prop].status.watering_status === 'object') {
          mClient.publish(`bhyve/${deviceId}/status`, JSON.stringify(data[prop].status.watering_status))
        } else {
          mClient.publish(`bhyve/${deviceId}/status`, null)
        }
        console.log(`${ts()} - status: ` + JSON.stringify(data[prop].status.watering_status))

        mClient.publish(`bhyve/${deviceId}/details`, JSON.stringify(data[prop]))
        for (let zone in data[prop].zones) {
          let station = data[prop].zones[zone].station
          mClient.publish(`bhyve/${deviceId}/zone/${station}`, JSON.stringify(data[prop].zones[zone]))
          mClient.subscribe(`bhyve/${deviceId}/zone/${station}/set`, (err, granted) => {
            if (err) {
              console.error(`mClient.subscribe bhyve/${deviceId}/zone/${station}/set error:`)
              console.error(err)
            }
            console.log('granted: ' + JSON.stringify(granted))
          })
        }
      }
    }
    mClient.publish(`bhyve/devices`, JSON.stringify(devices))

    oClient.connectStream()
  }
})

const parseMessage = (topic, message) => {
  // looking for
  // topic: bhyve/{device_id}/zone/{station}/set
  // message: ON/OFF
  let found = topic.match(/bhyve\/(.*)\/zone\/(\d)\/set/)
  let deviceId = found[1]
  let station = found[2]
  let command = message.toString()
  let myJSON = {}
  console.log('deviceId: ' + deviceId + ' station: ' + station + ' command: ' + require('util').inspect(command))
  switch (command) {
    case 'ON':
      myJSON = {
        'event': 'change_mode',
        'device_id': deviceId,
        'timestamp': ts(),
        'mode': 'manual',
        'stations': [
          {
            'station': station,
            'run_time': 10
          }
        ]
      }
      console.log('in ON')
      break
      //    case 'OFF':
      //      console.log('in OFF')
    default:
      console.log('in default')
      myJSON = { 'event': 'change_mode', 'device_id': deviceId, 'timestamp': ts(), 'mode': 'manual', 'stations': [] }
  }
  oClient.send(myJSON)

  console.log('myJSON: ' + JSON.stringify(myJSON))

  // to construct a JSON object like
  //
}

mClient.on('message', (topic, message) => {
  console.log('topic: ' + topic + ' message: ' + message.toString())
  parseMessage(topic, message)
})

oClient.on('error', (err) => {
  console.log('Orbit Error: ' + err)
})

const parseMode = (data) => {
  let mode = data.mode
  // let program = data.program
  let stations = data.stations
  // let deviceID = data.device_id

  for (let station in stations) {
    console.log('station: ' + data.stations[station].station + 'mode: ' + mode + ' run_time: ' + data.stations[station].run_time)
  }
}

oClient.on('message', (data) => {
  console.log(`${ts()} - message: ` + JSON.stringify(data))
  let event = data.event
  if (MCLIENT_ONLINE) mClient.publish('bhyve/message', JSON.stringify(data))
  console.log('event: ' + event)

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
