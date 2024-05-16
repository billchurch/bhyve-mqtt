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
import { createMqttClient } from './mqttClient.js'; // Import the module
import dotenv from 'dotenv';

dotenv.config();

const orbitDebug = debug('orbit');
const mqttClientDebug = debug('mqttClient');

const orbitClient = new Orbit();

const handleMqttClientError = (err) => {
  console.error(`${ts()} - connection error to broker: ${err}`);
};

let MQTTCLIENT_ONLINE = false;
const ts = () => new Date().toISOString();

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
      console.error(`mqttClient.subscribe ${topic} error:`);
      console.error(`    ${err}`);
    }
    console.log(`${ts()} - granted: ${JSON.stringify(granted)}`);
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
  const CMD_VALID = JSONvalidate(command);

  if (!CMD_VALID) {
    throw new Error(JSON.stringify(JSONvalidate.errors));
  }

  return command;
};

const constructMessage = (deviceId, station, command) => {
  const myJSON = {
    event: 'change_mode',
    device_id: deviceId,
    timestamp: ts(),
    mode: 'manual',
    stations: [],
  };

  if (command.state.toLowerCase() === 'on') {
    myJSON.stations.push({ station, run_time: command.time });
  }

  return myJSON;
};

const parseMessage = (topic, message) => {
  mqttClientDebug(`parseMessage: topic: ${topic}, message: ${message}`);

  const matchTopic = topic.match(/bhyve\/device\/(.*)\/zone\/(\d)\/set/);
  switch (topic) {
    case (matchTopic || {}).input: {
      try {
        const [_, deviceId, station] = matchTopic;
        const command = validateCommand(message);
        const myJSON = constructMessage(deviceId, Number(station), command);

        orbitClient.send(myJSON);
        mqttClientDebug(`myJSON: ${util.inspect(myJSON, { depth: null })}`);
      } catch (error) {
        console.error(`${ts()} - Error: ${error.message}`);
      }
      break;
    }
    case (topic.match(/bhyve\/device\/(.*)\/refresh/) || {}).input:
    case 'bhyve/device/refresh': {
      console.log(`${ts()} - refresh`);
      orbitClient.devices();
      break;
    }
    default:
      mqttClientDebug(`default: ${topic}`);
      break;
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
    console.error(`${ts()} parseMessage ERROR: JSON validate failed: `);
    console.error(`    validation error: ${e}`);
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

  Object.keys(data).forEach((prop) => {
    const device = data[prop];
    const deviceId = device.id;
    devices.push(deviceId);
    orbitDebug(`devices: ${JSON.stringify(devices)}`);

    let deviceStatus = '';
    if (device.status && typeof device.status.watering_status === 'object') {
      deviceStatus = JSON.stringify(device.status.watering_status);
    }
    mqttClient.publish(`bhyve/device/${deviceId}/status`, deviceStatus);
    orbitDebug(`deviceStatus (${deviceId}): ${deviceStatus}`);

    subscribeHandler(`bhyve/device/${deviceId}/refresh`);
    mqttClient.publish(
      `bhyve/device/${deviceId}/details`,
      JSON.stringify(device),
      {
        retain: true,
      },
    );

    if (device.zones && typeof device.zones === 'object') {
      Object.keys(device.zones).forEach((zoneKey) => {
        const { station } = device.zones[zoneKey];
        subscribeHandler(`bhyve/device/${deviceId}/zone/${station}/set`);
        mqttClient.publish(
          `bhyve/device/${deviceId}/zone/${station}`,
          JSON.stringify(device.zones[zoneKey]),
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
  const { event } = data;
  if (MQTTCLIENT_ONLINE) {
    if (data.device_id) {
      mqttClient.publish(`bhyve/device/${data.device_id}/message`, json);
    } else {
      mqttClient.publish('bhyve/message', json);
    }
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
