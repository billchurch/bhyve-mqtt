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
let ORBIT_CONNECTED = false;

const subscribedTopics = new Set(); // Set to track subscribed topics

const MAX_RETRIES = process.env.MAX_RETRIES
  ? parseInt(process.env.MAX_RETRIES, 10)
  : 10;
const RECONNECT_PERIOD = process.env.RECONNECT_PERIOD
  ? parseInt(process.env.RECONNECT_PERIOD, 10)
  : 5000;

const mqttConfig = {
  brokerAddress: process.env.MQTT_BROKER_ADDRESS,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
  clientId: `bhyve-mqtt_${Math.random().toString(16).substring(2, 8)}`,
  willTopic: 'bhyve/online',
  maxRetries: MAX_RETRIES,
  reconnectPeriod: RECONNECT_PERIOD,
};

const ts = () => new Date().toISOString();

const handleMqttClientError = (err) => {
  console.error(`${ts()} - connection error to broker: ${err}`);
  // Additional error handling logic can be added here if needed
};

let mqttClient;

const initializeMqttClient = () => {
  mqttClient = createMqttClient(
    mqttClientDebug,
    handleMqttClientError,
    mqttConfig,
  );

  mqttClient.on('connect', () => {
    console.log(`${ts()} - mqtt connected`);
    MQTTCLIENT_ONLINE = true;
    orbitConnect();
    resubscribeToTopics();

    if (ORBIT_CONNECTED) {
      publishOnline();
    }
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

  mqttClient.on('offline', () => {
    MQTTCLIENT_ONLINE = false;
    console.warn(`${ts()} - mqtt client offline`);
  });

  mqttClient.on('close', () => {
    MQTTCLIENT_ONLINE = false;
    console.log(`${ts()} - mqtt client connection closed`);
  });

  mqttClient.on('reconnect', () => {
    MQTTCLIENT_ONLINE = false;
    console.log(`${ts()} - mqtt client reconnecting`);
  });
};

const publishHandler = (err) => {
  if (err) {
    console.error(`${ts()} - mqtt publish error: ${err}`);
  } else {
    mqttClientDebug('mqtt publish successful');
  }
};

const subscribeHandler = (topic) => {
  if (!subscribedTopics.has(topic)) {
    subscribedTopics.add(topic);
    console.log(`${ts()} - subscribe topic: ${topic}`);
    mqttClient.subscribe(topic, (err, granted) => {
      if (err) {
        console.error(`mqttClient.subscribe ${topic} error: ${err}`);
      } else {
        console.log(`${ts()} - granted: ${JSON.stringify(granted)}`);
      }
    });
  }
};

const resubscribeToTopics = () => {
  subscribedTopics.forEach((topic) => {
    console.log(`${ts()} - resubscribe topic: ${topic}`);
    mqttClient.subscribe(topic, (err, granted) => {
      if (err) {
        console.error(`mqttClient.subscribe ${topic} error: ${err}`);
      } else {
        console.log(`${ts()} - granted: ${JSON.stringify(granted)}`);
      }
    });
  });
};

const publishOnline = () => {
  console.log(`${ts()} - publishOnline`);
  if (MQTTCLIENT_ONLINE && ORBIT_CONNECTED) {
    mqttClient.publish('bhyve/alive', ts(), publishHandler);
    mqttClient.publish(
      'bhyve/online',
      'true',
      { qos: 0, retain: true },
      publishHandler,
    );
    console.log('Orbit API Connected and Authenticated');
  }
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
      const [, deviceId, station] = matchTopic;
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
  if (!ORBIT_CONNECTED) {
    orbitClient.connect({
      email: process.env.ORBIT_EMAIL,
      password: process.env.ORBIT_PASSWORD,
    });
  }
};

orbitClient.on('authenticated', () => {
  ORBIT_CONNECTED = true; // Set the flag to true
  publishOnline();
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

initializeMqttClient();

export { mqttClient, orbitClient };
