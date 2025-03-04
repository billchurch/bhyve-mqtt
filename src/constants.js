// Default values
export const DEFAULT_VALUES = {
    MAX_RETRIES: 10,
    RECONNECT_PERIOD: 5000
};

// Topic structure constants
export const TOPICS = {
    prefix: 'bhyve',
    online: 'bhyve/online',
    alive: 'bhyve/alive',
    devices: 'bhyve/devices',
    device: 'bhyve/device',
    message: 'bhyve/message',
    deviceRefresh: 'bhyve/device/refresh',
};

/**
 * Creates MQTT configuration object
 * 
 * @param {string} [username] - MQTT username
 * @param {string} [password] - MQTT password
 * @param {number} reconnectPeriod - Time between reconnection attempts in ms
 * @param {string} clientId - Client identifier
 * @param {string} willTopic - Last Will and Testament topic
 * @returns {Object} MQTT configuration object
 */
export const createMqttConfig = (username, password, reconnectPeriod, clientId, willTopic) => ({
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
});

/**
 * Gets a numeric value from environment variable with fallback
 * 
 * @param {string} name - Environment variable name
 * @param {number} defaultValue - Default value if env var is not set or invalid
 * @returns {number} The value from env or default
 */
export const getEnvNumber = (name, defaultValue) => {
    const value = process.env[name];
    if (value === undefined || value === '') {
        return defaultValue;
    }
    
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};