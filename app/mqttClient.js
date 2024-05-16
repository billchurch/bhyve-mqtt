// mqttClient.js
import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

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

const createMqttClient = (mqttClientDebug, errorHandler) => {
  const client = mqtt.connect(process.env.MQTT_BROKER_ADDRESS, MQTT_CONFIG);
  client.on('error', errorHandler);
  client.on('offline', () => mqttClientDebug('BROKER OFFLINE'));
  return client;
};

export { createMqttClient };
