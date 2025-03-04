// mqttClient.js
import mqtt from 'mqtt';

const ts = () => new Date().toISOString();

const createMqttClient = (mqttClientDebug, errorHandler, config) => {
  const {
    brokerAddress,
    username,
    password,
    clientId,
    willTopic,
    maxRetries,
    reconnectPeriod,
  } = config;
  let retryCount = 0;
  let client;

  const MQTT_CONFIG = {
    username,
    password,
    keepalive: 10000,
    connectTimeout: 120000,
    reconnectPeriod,
    clientId,
    will: {
      topic: willTopic,
      payload: 'false',
      qos: 0,
      retain: true,
    },
  };

  const connect = () => {
    client = mqtt.connect(brokerAddress, MQTT_CONFIG);

    client.on('error', (err) => {
      errorHandler(err);
      if (err.code === 5) {
        // Connection refused: not authorized
        mqttClientDebug(`Authentication failed. Giving up.`);
        client.end(true);
        process.exit(1);
      }
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
        mqttClientDebug(
          `Max retries reached. Terminating process after ${maxRetries} attempts.`,
        );
        client.end(true);
        process.exit(1);
      }
    });
  };

  connect();

  return client;
};

export { createMqttClient };
