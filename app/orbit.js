const axios = require('axios');
const { EventEmitter } = require('events');
const WebSocket = require('ws');

const ts = () => new Date().toISOString();

class Client extends EventEmitter {
  #token;

  #userId;

  #deviceId;

  #stream;

  #restConfig;

  config;

  constructor() {
    super();
    this.config = {
      wssURL: 'wss://api.orbitbhyve.com/v1/events',
      baseURL: 'https://api.orbitbhyve.com',
      timeout: 10000,
      email: undefined,
      password: undefined,
      debug: false,
    };
  }

  normalizeConfig(cfg) {
    this.config = { ...this.config, ...cfg };
  }

  async connect(cfg) {
    this.normalizeConfig(cfg);
    try {
      const response = await axios
        .create({
          baseURL: this.config.baseURL,
          timeout: this.config.timeout,
        })
        .post('/v1/session', {
          session: {
            email: this.config.email,
            password: this.config.password,
          },
        });

      this.#token = response.data.orbit_session_token;
      this.#userId = response.data.user_id;
      this.#restConfig = {
        baseURL: this.config.baseURL,
        timeout: this.config.timeout,
        headers: { 'orbit-session-token': this.#token },
      };

      if (this.config.debug) {
        console.log(
          `${ts()} - response.data: ${JSON.stringify(response.data)}`,
        );
      }

      this.emit('token', this.#token);
      this.emit('user_id', this.#userId);
    } catch (err) {
      if (this.config.debug) {
        console.log(`${ts()} - error ${err}`);
      }
      this.emit('error', err);
    }
  }

  async devices() {
    try {
      const response = await axios
        .create(this.#restConfig)
        .get(`/v1/devices?user_id=${this.#userId}`);
      if (this.config.debug) {
        console.log(
          `${ts()} - response.data: ${JSON.stringify(response.data)}`,
        );
      }
      this.#deviceId = response.data[0].id;
      this.emit('devices', response.data);
      this.emit('device_id', this.#deviceId);
    } catch (err) {
      if (this.config.debug) {
        console.log(`${ts()} - error: ${err}`);
      }
      this.emit('error', err);
    }
  }

  send(message) {
    this.#stream.send(JSON.stringify(message));
    console.log(`send json: ${JSON.stringify(message)}`);
  }

  connectStream() {
    this.#stream = new WebSocket(this.config.wssURL, {
      handshakeTimeout: this.config.wsTimeout,
    });

    const sendPing = () => {
      if (this.config.debug) console.log(`${ts()} - websocket sending ping`);
      this.#stream.send('{"event":"ping"}');
    };

    this.#stream.on('open', () => {
      const message = {
        event: 'app_connection',
        orbit_session_token: this.#token,
      };

      if (this.config.debug) {
        console.log(
          `${ts()} - websocket authenticate message: ${JSON.stringify(
            message,
          )}`,
        );
      }

      this.#stream.send(JSON.stringify(message));
      setInterval(sendPing, 25 * 1000);
    });

    this.#stream.on('message', (data) => {
      this.emit('message', JSON.parse(data));
    });

    this.#stream.on('error', (err) => {
      this.emit('error', err);
    });

    this.#stream.on('close', (num, reason) => {
      if (this.config.debug) {
        console.log(`${ts()} - close: ${num} reason: ${reason}`);
      }
    });

    this.#stream.on('unexpected-response', (request, response) => {
      console.error(
        `${ts()} - unexpected-response / request: ${JSON.stringify(
          request,
        )} response: ${JSON.stringify(response)}`,
      );
    });
  }
}

module.exports = Client;
