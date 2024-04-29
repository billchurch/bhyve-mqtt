// mqttClient.js
const mqtt = require('mqtt');
const debug = require('debug')('mqttClient');

const ts = () => new Date().toISOString();
require('dotenv').config();

const MQTT_CONFIG = {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
  keepalive: 10000,
  connectTimeout: 120000,
  reconnectPeriod: 1000,
  clientId: `bhyve-mqtt_${Math.random().toString(16).substring(2, 8)}`,
  will: {
    topic: 'bhyve/online',
    payload: 'false',
    qos: 0,
    retain: true,
  },
};

function handleClientError(err) {
  console.error(`${ts()} - connection error to broker, exiting`);
  console.error(`    ${err}`);
  setTimeout(() => {
    process.exit();
  }, 10000);
}

function createMqttClient() {
  const client = mqtt.connect(process.env.MQTT_BROKER_ADDRESS, MQTT_CONFIG);
  client.on('error', handleClientError);
  client.on('offline', () => debug('BROKER OFFLINE'));
  // more debug logs can be added wherever needed
  return client;
}

module.exports = { createMqttClient };
