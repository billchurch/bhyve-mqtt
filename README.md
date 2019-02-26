##  bhyve-mqtt
This app is designed to subscribe to the AmbientWeather Realtime API and broadcast the messages out over MQTT topics

### Usage

```
cp .env-sample .env
// fill out all the config details
npm install
npm start
```

### Environment Configuration

| key                  | description                                                                |
|----------------------|----------------------------------------------------------------------------|
| MQTT_BROKER_ADDRESS  | MQTT broker URL (eg. `mqtt://localhost:1883`)                              |
| MQTT_USER            | Broker user                                                                |
| MQTT_PASSWORD        | Broker password                                                            |
| MQTT_UPDATE_TOPIC    | Broker topic for realtime updates from AmbientWeather                      |
| MQTT_CONNECT_TOPIC   | Broker topic for initial connections to the AmbientWeather Realtime socket |
| MQTT_SUBSCRIBE_TOPIC | Broker topic for successful subscription to the realtime API               |

