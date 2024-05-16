/*
 * app.js
 *
 * unofficial Orbit Bhyve API to MQTT gateway
 * Bill Church - https://github.com/billchurch/bhyve-mqtt
 *
 */
import util from 'util';
import Ajv from 'ajv';
import debug from 'debug';
import Orbit from 'bhyve-api';
import { createMqttClient } from './mqttClient.js';
import dotenv from 'dotenv';

dotenv.config();

const orbitDebug = debug('orbit');
const mqttClientDebug = debug('mqttClient');

const orbitClient = new Orbit();

let MQTTCLIENT_ONLINE = false;
const ts = () => new Date().toISOString();

const handleMqttClientError = (err) => {
  console.error(`${ts()} - connection error to broker: ${err}`);
  // Additional error handling logic can be added here if needed
};

const mqttClient = createMqttClient(mqttClientDebug, handleMqttClientError);

const publishHandler = (err) => {
  if (err) {
    console.error(`${ts()} - mqtt publish error: ${err}`);
  } else {
    mqttClientDebug('mqtt publish successful');
  }
};

const subscribeHandler = (topic) => {
  console.log(`${ts()} - subscribe topic: ${topic}`);
  mqttClient.subscribe(topic, (err, granted) => {
    if (err) {
      console.error(`mqttClient.subscribe ${topic} error: ${err}`);
    } else {
      console.log(`${ts()} - granted: ${JSON.stringify(granted)}`);
    }
  });
};

const validateCommand = (message) => {
  const ajv = new Ajv();
  const cmdSchema = {
    type: 'object',
    properties: {
      time: {
        type: 'number',
        minimum: 1,
        maximum: 999,
      },
      state: {
        type: 'string',
        enum: ['ON', 'OFF', 'on', 'off'],
      },
    },
    if: {
      properties: {
        state: {
          enum: ['ON', 'on'],
        },
      },
      required: ['state'],
    },
    then: {
      required: ['time'],
    },
  };

  const JSONvalidate = ajv.compile(cmdSchema);
  const command = JSON.parse(message);
  if (!JSONvalidate(command)) {
    throw new Error(JSON.stringify(JSONvalidate.errors));
  }
  return command;
};

const constructMessage = (deviceId, station, command) => ({
  event: 'change_mode',
  device_id: deviceId,
  timestamp: ts(),
  mode: 'manual',
  stations:
    command.state.toLowerCase() === 'on'
      ? [{ station, run_time: command.time }]
      : [],
});

const parseMessage = (topic, message) => {
  mqttClientDebug(`parseMessage: topic: ${topic}, message: ${message}`);

  const matchTopic = topic.match(/bhyve\/device\/(.*)\/zone\/(\d)\/set/);
  if (matchTopic) {
    try {
      const [_, deviceId, station] = matchTopic;
      const command = validateCommand(message);
      const myJSON = constructMessage(deviceId, Number(station), command);

      orbitClient.send(myJSON);
      mqttClientDebug(`myJSON: ${util.inspect(myJSON, { depth: null })}`);
    } catch (error) {
      console.error(`${ts()} - Error: ${error.message}`);
    }
  } else if (
    topic.match(/bhyve\/device\/(.*)\/refresh/) ||
    topic === 'bhyve/device/refresh'
  ) {
    console.log(`${ts()} - refresh`);
    orbitClient.devices();
  } else {
    mqttClientDebug(`default: ${topic}`);
  }
};

const orbitConnect = () => {
  orbitClient.connect({
    email: process.env.ORBIT_EMAIL,
    password: process.env.ORBIT_PASSWORD,
  });
};
mqttClient.on('error', (err) => {
  console.error(`${ts()} - MQTT Client Error: ${err.message}`);
});

mqttClient.on('connect', () => {
  console.log(`${ts()} - mqtt connected`);
  MQTTCLIENT_ONLINE = true;
  orbitConnect();
});

mqttClient.on('message', (topic, message) => {
  mqttClientDebug(`parseMessage: topic: ${topic}, message: ${message}`);
  try {
    parseMessage(topic, message);
  } catch (e) {
    console.error(`${ts()} parseMessage ERROR: JSON validate failed: ${e}`);
    console.error(`    client message: ${message.toString()}`);
  }
});

orbitClient.on('token', (token) => {
  if (MQTTCLIENT_ONLINE) {
    mqttClient.publish('bhyve/alive', ts(), publishHandler);
    mqttClient.publish(
      'bhyve/online',
      'true',
      { qos: 0, retain: true },
      publishHandler,
    );
  }
  orbitDebug(`Token: ${token}`);
  console.log('Orbit API Connected and Token Received');
});

orbitClient.on('user_id', (userId) => {
  orbitDebug(`User ID: ${userId}`);
  orbitClient.devices();
});

orbitClient.on('device_id', (deviceId) => {
  orbitDebug(`Device ID: ${deviceId}`);
});

orbitClient.on('devices', (data) => {
  if (!MQTTCLIENT_ONLINE) return;

  const devices = [];
  subscribeHandler('bhyve/device/refresh');

  Object.values(data).forEach((device) => {
    const { id: deviceId, status, zones } = device;
    devices.push(deviceId);
    orbitDebug(`devices: ${JSON.stringify(devices)}`);

    const deviceStatus = status?.watering_status
      ? JSON.stringify(status.watering_status)
      : '';
    mqttClient.publish(`bhyve/device/${deviceId}/status`, deviceStatus);
    orbitDebug(`deviceStatus (${deviceId}): ${deviceStatus}`);

    subscribeHandler(`bhyve/device/${deviceId}/refresh`);
    mqttClient.publish(
      `bhyve/device/${deviceId}/details`,
      JSON.stringify(device),
      { retain: true },
    );

    if (zones) {
      Object.values(zones).forEach(({ station }) => {
        subscribeHandler(`bhyve/device/${deviceId}/zone/${station}/set`);
        mqttClient.publish(
          `bhyve/device/${deviceId}/zone/${station}`,
          JSON.stringify(device.zones[station]),
        );
      });
    } else {
      console.warn(`${ts()} - Warning: No zones data for device ${deviceId}`);
    }
  });

  mqttClient.publish('bhyve/devices', JSON.stringify(devices));
  orbitClient.connectStream();
});

orbitClient.on('error', (err) => {
  console.error(`${ts()} - Orbit Error: ${err}`);
});

orbitClient.on('message', (data) => {
  const json = JSON.stringify(data);
  orbitDebug(`Orbit Message: ${json}`);
  const { event, device_id: deviceId } = data;
  if (MQTTCLIENT_ONLINE) {
    const topic = deviceId
      ? `bhyve/device/${deviceId}/message`
      : 'bhyve/message';
    mqttClient.publish(topic, json);
  }
  console.log(`${ts()} - event: ${event}`);
});

const signals = ['SIGTERM', 'SIGINT'];
signals.forEach((signal) =>
  process.on(signal, () => {
    if (mqttClient) mqttClient.end();
    throw new Error(`${ts()} - event: ${signal}, shutting down`);
  }),
);

export { mqttClient, orbitClient };
