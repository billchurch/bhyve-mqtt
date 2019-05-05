#  bhyve-mqtt
This app is designed to subscribe to the AmbientWeather Realtime API and broadcast the messages out over MQTT topics and is currently a work in progress. Any help is greatly appreciated.

At this point, status and device informatin should be populated.

## To Do
- Handle commands from MQTT to Orbit API (start/stop watering, settings schedules, etc...)

## Usage

```
cp .env-sample .env
// fill out all the config details
npm install
npm start
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

bhyve/alive - We received a token from the bhyve API and should be ready to work
bhyve/${deviceID}/status - If bhyve has an active event, relay this event, else null
bhyve/${deviceID}/details - A ridiculous amount of info, most important is list of zones for the device
bhyve/${deviceID}/zone/${num} - Zone detail
bhyve/${deviceID}/devices - List of devices
bhyve/${deviceID}/message - Relay of event from the API example:
```
{"event":"change_mode","mode":"manual","program":null,"stations":[],"device_id":"e2398h2398h89h2ff","timestamp":"2019-05-05T08:50:06.000Z"}`
```


