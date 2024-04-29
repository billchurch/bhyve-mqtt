'use strict'
/*
 * orbit.js
 *
 * unofficial Orbit Bhyve API module
 * Bill Church - https://github.com/billchurch/bhyve-mqtt
 *
 */

// todo implement https://github.com/websockets/ws/wiki/client-auto-reconnect-with-ping-listener---exponential-back-off-timeout

const axios = require('axios')
const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const WebSocket = require('ws')
const ts = () => new Date().toISOString()

function Client () {
  if (!(this instanceof Client)) { return new Client() }
  EventEmitter.call(this)

  this.config = {
    wssURL: undefined,
    baseURL: undefined,
    timeout: undefined,
    email: undefined,
    password: undefined,
    debug: undefined
  }
  this._token = undefined
  this._user_id = undefined
  this._device_id = undefined
}
inherits(Client, EventEmitter)

const normalizeConfig = (cfg) => {
  const config = []
  config.baseURL = cfg.baseURL || 'https://api.orbitbhyve.com'
  config.timeout = cfg.timeout || 10000
  config.email = cfg.email || undefined
  config.password = cfg.password || undefined
  config.debug = cfg.debug || false
  config.wssURL = cfg.wssURL || 'wss://api.orbitbhyve.com/v1/events'
  config.wsTimeout = cfg.wsTimeout || 10000
  config.debug = cfg.debug || false
  return config
}
// first step, get a token and generate an event on success or fail
Client.prototype.connect = function (cfg) {
  this.config = normalizeConfig(cfg)
  const self = this

  const getOrbitToken = () => {
    return new Promise((resolve, reject) => {
      const instance = axios.create({
        baseURL: self.config.baseURL,
        timeout: self.config.timeout
      })
      instance.post('/v1/session', {
        session: {
          email: self.config.email,
          password: self.config.password
        }
      }).then(function (response) {
        self._token = response.data.orbit_session_token
        self._user_id = response.data.user_id
        // config for later sessions
        self._rest_config = { baseURL: self.config.baseURL, timeout: self.config.timeout, headers: { 'orbit-session-token': self._token } }
        if (self.config.debug) console.log(`${ts()} - response.data: ` + JSON.stringify(response.data))
        resolve(response)
      }).catch(function (err) {
        reject(err)
      })
    })
  }

  const doAccept = () => {
    if (self.config.debug) console.log(`${ts()} - token: ` + self._token + ' My UserID: ' + self._user_id)
    self.emit('token', self._token)
    self.emit('user_id', self._user_id)
  }
  const doReject = (err) => {
    if (self.config.debug) console.log(`${ts()} - error ` + err)
    self.emit('error', err)
  }

  const ost = getOrbitToken()
  ost.then(doAccept)
    .catch(doReject)
}

Client.prototype.devices = function () {
  const self = this

  const getDevices = () => {
    return new Promise((resolve, reject) => {
      const instance = axios.create(self._rest_config)
      instance.get('/v1/devices?user_id=' + self._user_id)
        .then(function (response) {
          if (self.config.debug) console.log(`${ts()} - response.data: ` + JSON.stringify(response.data))
          self._device_id = response.data[0].id
          resolve(response)
        }).catch(function (err) {
          reject(err)
        })
    })
  }

  const doAccept = (response) => {
    if (self.config.debug) console.log(`${ts()} - response.data: ` + JSON.stringify(response.data))
    self.emit('devices', response.data)
    self.emit('device_id', self._device_id)
  }
  const doReject = (err) => {
    if (self.config.debug) console.log(`${ts()} - error: ` + err)
    self.emit('error', err)
  }

  const Devices = getDevices()
  Devices.then(doAccept)
    .catch(doReject)
}

Client.prototype.send = function (message) {
  const self = this

  self._stream.send(JSON.stringify(message))
  console.log('send json: ' + JSON.stringify(message))
}

Client.prototype.connectStream = function () {
  const self = this

  self._stream = new WebSocket(self.config.wssURL, {
    handshakeTimeout: self.config.wsTimeout
  })

  function sendPing () {
    if (self.config.debug) console.log(`${ts()} - websocket sending ping`)
    self._stream.send('{"event":"ping"}')
  }

  const authenticate = () => {
    const message = {
      event: 'app_connection',
      orbit_session_token: self._token
    }

    if (self.config.debug) console.log(`${ts()} - websocket authenticate message: ` + JSON.stringify(message))

    self._stream.send(JSON.stringify(message))
    setInterval(sendPing, 25 * 1000)
  }

  self._stream.on('open', authenticate)

  self._stream.on('message', function (data) {
    self.emit('message', JSON.parse(data))
  })

  self._stream.on('error', function (err) {
    self.emit('error', err)
  })

  self._stream.on('close', function (num, reason) {
    if (self.config.debug) console.log(`${ts()} - close: ` + num + ' reason: ' + reason)
  })

  self._stream.on('ping', function (data) {
    if (self.config.debug) console.log(`${ts()} - ping data: ` + data)
  })

  self._stream.on('unexpected-response', function (request, response) {
    console.error(`${ts()} - unexpected-response / request: ` + JSON.stringify(request) + ' response: ' + JSON.stringify(response))
  })
}

module.exports = Client
