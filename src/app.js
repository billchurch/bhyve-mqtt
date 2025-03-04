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
import { TOPICS, DEFAULT_VALUES, getEnvNumber } from './constants.js';

dotenv.config();

const orbitDebug = debug('orbit');
const mqttClientDebug = debug('mqttClient');

const orbitClient = new Orbit();

let MQTTCLIENT_ONLINE = false;
let ORBIT_CONNECTED = false;

const subscribedTopics = new Set(); // Set to track subscribed topics

// Get config values from environment with fallbacks
const MAX_RETRIES = getEnvNumber('MAX_RETRIES', DEFAULT_VALUES.MAX_RETRIES);
const RECONNECT_PERIOD = getEnvNumber('RECONNECT_PERIOD', DEFAULT_VALUES.RECONNECT_PERIOD);

const mqttConfig = {
  brokerAddress: process.env.MQTT_BROKER_ADDRESS,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
  clientId: `bhyve-mqtt_${Math.random().toString(16).substring(2, 8)}`,
  willTopic: TOPICS.online,
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

/**
 * Subscribe to a topic with error handling
 * @param {string} topic - The topic to subscribe to
 * @param {boolean} [force=false] - Force subscription even if already subscribed
 */
const subscribeToTopic = (topic, force = false) => {
  // Skip if already subscribed and not forced
  if (!force && subscribedTopics.has(topic)) {
    return;
  }

  console.log(`${ts()} - ${force ? 're' : ''}subscribe topic: ${topic}`);
  mqttClient.subscribe(topic, (err, granted) => {
    if (err) {
      console.error(`mqttClient.subscribe ${topic} error: ${err}`);
    } else {
      // Only add to tracking set on successful subscription
      if (!subscribedTopics.has(topic)) {
        subscribedTopics.add(topic);
      }
      console.log(`${ts()} - granted: ${JSON.stringify(granted)}`);
    }
  });
};

/**
 * Subscribe handler for new topic subscriptions
 */
const subscribeHandler = (topic) => {
  subscribeToTopic(topic);
};

/**
 * Resubscribe to all previously subscribed topics
 */
const resubscribeToTopics = () => {
  subscribedTopics.forEach((topic) => {
    subscribeToTopic(topic, true);
  });
};

/**
 * Publish online status to MQTT topics
 */
const publishOnline = () => {
  console.log(`${ts()} - publishOnline`);
  if (MQTTCLIENT_ONLINE && ORBIT_CONNECTED) {
    mqttClient.publish(TOPICS.alive, ts(), publishHandler);
    mqttClient.publish(
      TOPICS.online,
      'true',
      { qos: 0, retain: true },
      publishHandler,
    );
    console.log('Orbit API Connected and Authenticated');
  }
};

/**
 * Validate command message against schema
 * @param {string|Buffer} message - Message to validate
 * @returns {Object} Validated command object
 * @throws {Error} If validation fails
 */
const validateCommand = (message) => {
  try {
    // Parse message to JSON if it's a string or Buffer
    const command = typeof message === 'string' || Buffer.isBuffer(message)
      ? JSON.parse(message.toString())
      : message;

    // Define validation schema
    const ajv = new Ajv({ allErrors: true });
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
      required: ['state'],
      additionalProperties: false,
    };

    // Validate command against schema
    const JSONvalidate = ajv.compile(cmdSchema);
    if (!JSONvalidate(command)) {
      const errors = JSONvalidate.errors.map(err =>
        `${err.instancePath} ${err.message}`).join('; ');
      throw new Error(`Command validation failed: ${errors}`);
    }

    return command;
  } catch (error) {
    if (error.name === 'SyntaxError') {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
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

/**
 * Parse incoming MQTT messages and take appropriate actions
 * @param {string} topic - The MQTT topic
 * @param {Buffer|string} message - The message payload
 */
const parseMessage = (topic, message) => {
  mqttClientDebug(`parseMessage: topic: ${topic}, message: ${message}`);

  try {
    // Topic pattern for device zone control
    const zoneSetPattern = new RegExp(`${TOPICS.device}\/([^\/]+)\/zone\/([0-9]+)\/set`);
    const matchTopic = topic.match(zoneSetPattern);

    if (matchTopic) {
      // Extract device ID and station from topic
      const [, deviceId, station] = matchTopic;

      // Validate station number
      if (!deviceId || deviceId.trim() === '') {
        throw new Error('Invalid device ID in topic');
      }

      const stationNum = Number(station);
      if (isNaN(stationNum) || stationNum < 0) {
        throw new Error(`Invalid station number: ${station}`);
      }

      // Parse and validate the command
      const command = validateCommand(message);
      const payload = constructMessage(deviceId, stationNum, command);

      // Send command to Orbit
      orbitClient.send(payload);
      mqttClientDebug(`Sending payload: ${util.inspect(payload, { depth: null })}`);
    }
    // Topic pattern for device refresh
    else if (
      topic.match(new RegExp(`${TOPICS.device}\/([^\/]+)\/refresh`)) ||
      topic === TOPICS.deviceRefresh
    ) {
      console.log(`${ts()} - refresh devices`);
      orbitClient.devices();
    } else {
      mqttClientDebug(`Unhandled topic: ${topic}`);
    }
  } catch (error) {
    console.error(`${ts()} - Error processing message on topic ${topic}: ${error.message}`);
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

/**
 * Handle device data and publish to appropriate topics
 */
orbitClient.on('devices', (data) => {
  if (!MQTTCLIENT_ONLINE) return;

  const devices = [];
  subscribeHandler(TOPICS.deviceRefresh);

  Object.values(data).forEach((device) => {
    const { id: deviceId, status, zones } = device;

    if (!deviceId) {
      console.warn(`${ts()} - Warning: Device without ID found, skipping`);
      return;
    }

    devices.push(deviceId);
    orbitDebug(`devices: ${JSON.stringify(devices)}`);

    // Publish device status
    const deviceStatus = status?.watering_status
      ? JSON.stringify(status.watering_status)
      : '';
    mqttClient.publish(`${TOPICS.device}/${deviceId}/status`, deviceStatus);
    orbitDebug(`deviceStatus (${deviceId}): ${deviceStatus}`);

    // Subscribe to device refresh topic
    subscribeHandler(`${TOPICS.device}/${deviceId}/refresh`);

    // Publish device details
    mqttClient.publish(
      `${TOPICS.device}/${deviceId}/details`,
      JSON.stringify(device),
      { retain: true },
    );

    // Process zones if they exist
    if (zones) {
      Object.values(zones).forEach(({ station }) => {
        if (station === undefined) {
          console.warn(`${ts()} - Warning: Zone without station found for device ${deviceId}`);
          return;
        }

        // Subscribe to zone control topic
        subscribeHandler(`${TOPICS.device}/${deviceId}/zone/${station}/set`);

        // Publish zone details
        mqttClient.publish(
          `${TOPICS.device}/${deviceId}/zone/${station}`,
          JSON.stringify(device.zones[station]),
        );
      });
    } else {
      console.warn(`${ts()} - Warning: No zones data for device ${deviceId}`);
    }
  });

  // Publish all device IDs to a single topic
  mqttClient.publish(TOPICS.devices, JSON.stringify(devices));
  orbitClient.connectStream();
});

orbitClient.on('error', (err) => {
  console.error(`${ts()} - Orbit Error: ${err}`);
});

/**
 * Handle messages from Orbit API and forward to MQTT
 */
orbitClient.on('message', (data) => {
  try {
    const json = JSON.stringify(data);
    orbitDebug(`Orbit Message: ${json}`);

    const { event, device_id: deviceId } = data;

    // Only publish if MQTT client is online
    if (MQTTCLIENT_ONLINE) {
      // Choose appropriate topic based on whether deviceId is available
      const topic = deviceId
        ? `${TOPICS.device}/${deviceId}/message`
        : TOPICS.message;

      mqttClient.publish(topic, json);
    }

    console.log(`${ts()} - event: ${event}`);
  } catch (error) {
    console.error(`${ts()} - Error handling Orbit message: ${error.message}`);
  }
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
