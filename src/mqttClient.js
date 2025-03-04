// mqttClient.js
import mqtt from 'mqtt';
import { createMqttConfig, DEFAULT_VALUES } from './constants.js';

/**
 * Creates an MQTT client with error handling and reconnection logic
 * 
 * @param {Function} mqttClientDebug - Debug logger function
 * @param {Function} errorHandler - Function to handle connection errors
 * @param {Object} config - Configuration object
 * @param {string} config.brokerAddress - MQTT broker address
 * @param {string} [config.username] - MQTT username
 * @param {string} [config.password] - MQTT password
 * @param {string} config.clientId - Client identifier
 * @param {string} config.willTopic - Last Will and Testament topic
 * @param {number} config.maxRetries - Maximum reconnection attempts
 * @param {number} config.reconnectPeriod - Time between reconnection attempts in ms
 * @returns {Object} MQTT client instance
 */
const createMqttClient = (mqttClientDebug, errorHandler, config) => {
  // Validate required config parameters
  if (!config || !config.brokerAddress) {
    throw new Error('MQTT broker address is required');
  }

  const {
    brokerAddress,
    username,
    password,
    clientId = `bhyve-mqtt_${Math.random().toString(16).substring(2, 8)}`,
    willTopic,
    maxRetries = DEFAULT_VALUES.MAX_RETRIES,
    reconnectPeriod = DEFAULT_VALUES.RECONNECT_PERIOD,
  } = config;

  let retryCount = 0;
  let client;
  // Default MQTT configuration
  const MQTT_CONFIG = createMqttConfig(
    username,
    password,
    reconnectPeriod,
    clientId,
    willTopic
  );
  /**
   * Connect to the MQTT broker and setup event handlers
   */
  const connect = () => {
    try {
      client = mqtt.connect(brokerAddress, MQTT_CONFIG);

      // Setup event handlers
      client.on('error', (err) => {
        errorHandler(err);

        // Handle specific error codes
        if (err.code === 5) { // Connection refused: not authorized
          mqttClientDebug(`Authentication failed. Giving up.`);
          client.end(true);
          errorHandler(new Error('Authentication failed'));
          return;
        }

        // All other errors are handled by reconnect logic
      });

      client.on('connect', () => {
        retryCount = 0;
        mqttClientDebug('MQTT Client connected');
      });

      client.on('offline', () => {
        mqttClientDebug('MQTT Client offline');
      });

      client.on('close', () => {
        mqttClientDebug('MQTT Client connection closed');
      });

      client.on('reconnect', () => {
        retryCount += 1;
        mqttClientDebug(`MQTT Client reconnecting, attempt ${retryCount}`);

        if (retryCount >= maxRetries) {
          const error = new Error(`Max reconnect retries (${maxRetries}) reached`);
          mqttClientDebug(`${error.message}`);
          client.end(true);
          errorHandler(error);
        }
      });
    } catch (error) {
      mqttClientDebug(`Failed to initialize MQTT client: ${error.message}`);
      errorHandler(error);
    }
  };

  connect();

  return client;
};

export { createMqttClient };
