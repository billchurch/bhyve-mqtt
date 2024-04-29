// mqttClient.js
const mqtt = require('mqtt');
require('dotenv').config();

const MQTT_CONFIG = {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
  keepalive: 10000,
  connectTimeout: 120000,
  reconnectPeriod: 1000,
  clientId: `bhyve-mqtt_${Math.random().toString(16).substring(2, 8)}`,
  will: {
    topic: "bhyve/online",
    payload: "false",
    qos: 0,
    retain: true
  }
};

function createMqttClient() {
  const client = mqtt.connect(process.env.MQTT_BROKER_ADDRESS, MQTT_CONFIG);
  client.on('error', handleClientError);
  client.on('offline', () => console.log(`${new Date().toISOString()} - BROKER OFFLINE`));
  // Add other event handlers here

  return client;
}

function handleClientError(err) {
  console.error(`${new Date().toISOString()} - connection error to broker, exiting`);
  console.error('    ' + err);
  setTimeout(() => {
    process.exit();
  }, 10000);
}

module.exports = { createMqttClient };
