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
  let devices = []

  for (let prop in data) {
    if (data.hasOwnProperty(prop)) {
      let deviceId = data[prop].id
      devices.push(deviceId)
      console.log(`${ts()} - devices: ` + JSON.stringify(data[prop]))
      if (typeof data[prop].status.watering_status === 'object') {
        if (MCLIENT_ONLINE) mClient.publish(`bhyve/${deviceId}/status`, JSON.stringify(data[prop].status.watering_status))
      } else {
        if (MCLIENT_ONLINE) mClient.publish(`bhyve/${deviceId}/status`, null)
      }
      console.log(`${ts()} - status: ` + JSON.stringify(data[prop].status.watering_status))

      if (MCLIENT_ONLINE) mClient.publish(`bhyve/${deviceId}/details`, JSON.stringify(data))
      for (let zone in data[prop].zones) {
        let station = data[prop].zones[zone].station
        if (MCLIENT_ONLINE) mClient.publish(`bhyve/${deviceId}/zone/${station}`, JSON.stringify(data[prop].zones[zone]))
      }
    }
  }
  if (MCLIENT_ONLINE) mClient.publish(`bhyve/devices`, JSON.stringify(devices))

  oClient.connectStream()
})

oClient.on('error', (err) => {
  console.log('Orbit Error: ' + err)
})

oClient.on('message', (data) => {
  console.log(`${ts()} - message: ` + data)
  if (MCLIENT_ONLINE) mClient.publish('bhyve/message', data)
})
