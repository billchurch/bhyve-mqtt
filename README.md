#  bhyve-mqtt
This app is designed to subscribe to the Orbit B-Hyve API and broadcast the messages out over MQTT topics and is currently a work in progress. Any help is greatly appreciated.

At this point, status and device information should be populated.

## To Do
- Handle commands from MQTT to Orbit API (start/stop watering, settings schedules, etc...)

## Usage

```
cd ./app
cp .env-sample .env
// fill out all the config details
npm install
npm start
```

## Docker Usage
Pretty simple, use [app/.env-sample](app/.env-sample) as a template and call docker accordingly:

```
docker run --env-file myenvfile bhyve-mqtt
```

## Environment Configuration

| key                  | description                                                                |
|----------------------|----------------------------------------------------------------------------|
| MQTT_BROKER_ADDRESS  | MQTT broker URL (eg. `mqtt://localhost:1883`)                              |
| ORBIT_EMAIL          | Broker user                                                                |
| MQTT_PASSWORD        | Broker password                                                            |
| MQTT_UPDATE_TOPIC    | Broker topic for realtime updates from AmbientWeather                      |
| MQTT_CONNECT_TOPIC   | Broker topic for initial connections to the AmbientWeather Realtime socket |
| MQTT_SUBSCRIBE_TOPIC | Broker topic for successful subscription to the realtime API               |


## MQTT Schema
Still a work in progress, this is as it stands now.

### Breaking Change
Schema changed from `bhyve/{deviceID}` to `bhyve/device/{deviceID}`

### Events
* **bhyve/alive** - _json_ - We received a token from the bhyve API and should be ready to work
* **bhyve/device/{deviceID}/status** - _json_ - If bhyve has an active event, relay this event, else null
* **bhyve/device/{deviceID}/details** - _json_ - A ridiculous amount of info, most important is list of zones for the device - **RETAINED**
* **bhyve/device/{deviceID}/zone/{num}** - _json_ - Zone detail
* **bhyve/device/{deviceID}/devices** - _json_ - List of devices
* **bhyve/device/{deviceID}/message** - _json_ - Relay of event from the API for the device example:
```
{"event":"change_mode","mode":"manual","program":null,"stations":[],"device_id":"ABC12345","timestamp":"2019-05-05T08:50:06.000Z"}`
```
* **bhyve/message** - _json_ - Relay of event from the API

### Commands
* **bhyve/device/{deviceID}/zone/{num}/set** - _json_ - `{ "state": "(ON|on|OFF|off)", "time": 12 }` - turns station on/off for _n_ minutes. `time` is not used/ignored for `OFF` state but is required for `ON` state. Examples:
```
// Sets zone 2 to ON for 20 minutes
bhyve/device/ABC12345/zone/2/set
{ "state": "ON", "time": 20 }
```
```
// Sets zone 2 to OFF
bhyve/device/ABC12345/zone/2/set
{ "state": "OFF" }
```
* **bhyve/device/refresh** - casues all devices to refresh details
* **bhyve/device/{deviceID}/refresh** - casues individual device to refresh details (not yet implemented)

