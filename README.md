# bhyve-mqtt
![image](https://github.com/user-attachments/assets/497d5413-c6f5-48ea-a4d7-2aa5324447e3)


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
cd bhyve-mqtt
cp .env-sample .env
# Edit .env with your credentials
npm install
npm start
```

> **Note:** The project structure has been updated. The application code is now in the `/src` directory instead of `/app` directory, following standard Node.js project layout.

## Docker Usage

Pre-built images are available on both Docker Hub and GitHub Container Registry:

- Docker Hub: [billchurch/bhyve-mqtt](https://hub.docker.com/r/billchurch/bhyve-mqtt)
- GitHub Container Registry: [ghcr.io/billchurch/bhyve-mqtt](https://ghcr.io/billchurch/bhyve-mqtt)

### Supported Platforms

The Docker images are built for multiple architectures, supporting:

- `linux/amd64`: Windows, Intel Macs, standard Linux servers
- `linux/arm64`: Apple Silicon Macs, Raspberry Pi 4 (64-bit OS)
- `linux/arm/v7`: Raspberry Pi 3 and 4 (32-bit OS)
- `linux/arm/v6`: Older Raspberry Pi models (Pi Zero, Pi 1)

Docker will automatically pull the correct image for your platform when you run:

```bash
# From Docker Hub
docker pull billchurch/bhyve-mqtt:latest

# From GitHub Container Registry
docker pull ghcr.io/billchurch/bhyve-mqtt:latest
```

Version tags follow semantic versioning (e.g., `1.2.3`, `1.2`, `1`).

### Building Locally

If you prefer to build the image yourself:

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

- **bhyve/online** - _string_ - `true` when service is connected, `false` when disconnected (sent as LWT)

- **bhyve/alive** - _string_ - Timestamp of last successful API connection
- **bhyve/devices** - _json_ - Array of device IDs
- **bhyve/device/{deviceID}/details** - _json_ - Complete device information **RETAINED**
- **bhyve/device/{deviceID}/status** - _json_ - Current watering status
- **bhyve/device/{deviceID}/zone/{num}** - _json_ - Zone configuration and status
- **bhyve/device/{deviceID}/message** - _json_ - Events from the API for specific device
- **bhyve/message** - _json_ - General events from the API

### Command Topics (send to these topics)

- **bhyve/device/{deviceID}/zone/{num}/set** - _json_ - Control a specific zone:

  ```json
  { "state": "ON", "time": 5 }  // Turn on for 5 minutes
  ```

  ```json
  { "state": "OFF" }  // Turn off
  ```

- **bhyve/device/refresh** - _any_ - Request refresh of all device data

- **bhyve/device/{deviceID}/refresh** - _any_ - Request refresh for specific device

## Testing

The project includes several test scripts to verify functionality:

- **test-api.js** - Tests the bhyve-api connection only
- **test-mqtt.js** - Tests MQTT connectivity only
- **test-integration.js** - Full end-to-end integration test

To run tests:

```bash
npm run test
```

## Uses bhyve-api

This project now uses the [bhyve-api](https://github.com/billchurch/bhyve-api) npm module, which is a separate project that handles the core Orbit B-Hyve API communication.

## Docker Setup

This project includes a production-ready Dockerfile that implements security best practices and optimized image size through multi-stage builds.

### Building the Docker Image

Build the image with:

```bash
docker build -t bhyve-mqtt .
```

You can tag the image with a version:

```bash
docker build -t bhyve-mqtt:1.0 .
```

### Running the Container

The simplest way to run the container is using an environment file:

```bash
# Create your environment file
cp .env-sample .env
# Edit .env with your credentials
nano .env

# Run with environment variables from file
docker run -d --name bhyve-mqtt --env-file .env bhyve-mqtt
```

Alternatively, specify environment variables directly:

```bash
docker run -d --name bhyve-mqtt \
  -e ORBIT_EMAIL=your-email@example.com \
  -e ORBIT_PASSWORD=your-password \
  -e MQTT_BROKER_ADDRESS=mqtt://your-broker:1883 \
  -e MQTT_USER=your-mqtt-user \
  -e MQTT_PASSWORD=your-mqtt-password \
  bhyve-mqtt
```

### Container Management

View logs:

```bash
docker logs bhyve-mqtt
```

Follow logs in real-time:

```bash
docker logs -f bhyve-mqtt
```

Stop the container:

```bash
docker stop bhyve-mqtt
```

Restart the container:

```bash
docker restart bhyve-mqtt
```

Remove the container:

```bash
docker rm -f bhyve-mqtt
```

### Docker Compose

For easier management, you can use Docker Compose. Create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  bhyve-mqtt:
    image: bhyve-mqtt:latest
    container_name: bhyve-mqtt
    restart: unless-stopped
    env_file:
      - .env
```

Then run:

```bash
docker-compose up -d
```
