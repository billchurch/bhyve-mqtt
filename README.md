#  bhyve-mqtt
This app is designed to subscribe to the Orbit B-Hyve API and broadcast the messages out over MQTT topics. It also supports sending commands to control your B-Hyve devices through MQTT.

## Features
- Connects to the Orbit B-Hyve API
- Publishes device status and details to MQTT topics
- Controls sprinkler zones via MQTT commands
- Supports turning zones on/off
- Automatically reconnects when connections are lost

## Requirements
- Node.js v16 or higher
- MQTT broker (like Mosquitto, HiveMQ, etc.)
- Orbit B-Hyve account and devices

## Installation

```bash
git clone https://github.com/billchurch/bhyve-mqtt.git
cd bhyve-mqtt/app
cp .env-sample .env
# Edit .env with your credentials
npm install
npm start
```

## Docker Usage
Use the provided Dockerfile to build and run in a container:

```bash
# Build the image
docker build -t bhyve-mqtt .

# Run with your environment file
docker run --env-file myenvfile bhyve-mqtt
```

## Environment Configuration

| key                  | description                                                           |
|----------------------|-----------------------------------------------------------------------|
| ORBIT_EMAIL          | Your Orbit B-Hyve account email                                       |
| ORBIT_PASSWORD       | Your Orbit B-Hyve account password                                    |
| MQTT_BROKER_ADDRESS  | MQTT broker URL (eg. `mqtt://localhost:1883`)                         |
| MQTT_USER            | MQTT broker username (if required)                                    |
| MQTT_PASSWORD        | MQTT broker password (if required)                                    |
| MAX_RETRIES          | (Optional) Maximum connection retry attempts (default: 10)            |
| RECONNECT_PERIOD     | (Optional) Milliseconds between reconnection attempts (default: 5000) |

## MQTT Schema

### Status Topics (published by bhyve-mqtt)
* **bhyve/online** - _string_ - `true` when service is connected, `false` when disconnected (sent as LWT)
* **bhyve/alive** - _string_ - Timestamp of last successful API connection
* **bhyve/devices** - _json_ - Array of device IDs
* **bhyve/device/{deviceID}/details** - _json_ - Complete device information **RETAINED**
* **bhyve/device/{deviceID}/status** - _json_ - Current watering status
* **bhyve/device/{deviceID}/zone/{num}** - _json_ - Zone configuration and status
* **bhyve/device/{deviceID}/message** - _json_ - Events from the API for specific device
* **bhyve/message** - _json_ - General events from the API

### Command Topics (send to these topics)
* **bhyve/device/{deviceID}/zone/{num}/set** - _json_ - Control a specific zone:
  ```json
  { "state": "ON", "time": 5 }  // Turn on for 5 minutes
  ```
  ```json
  { "state": "OFF" }  // Turn off
  ```
* **bhyve/device/refresh** - _any_ - Request refresh of all device data
* **bhyve/device/{deviceID}/refresh** - _any_ - Request refresh for specific device

## Testing
The project includes several test scripts to verify functionality:

* **test-api.js** - Tests the bhyve-api connection only
* **test-mqtt.js** - Tests MQTT connectivity only
* **test-integration.js** - Full end-to-end integration test

To run tests:
```bash
cd app
node test-api.js
```

## Uses bhyve-api
This project now uses the [bhyve-api](https://github.com/billchurch/bhyve-api) npm module, which is a separate project that handles the core Orbit B-Hyve API communication.

