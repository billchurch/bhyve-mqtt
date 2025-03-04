# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.1.3](https://github.com/billchurch/bhyve-mqtt/compare/bhyve-mqtt-v0.1.2...bhyve-mqtt-v0.1.3) (2025-03-04)


### Features

* add `bhyve/online` feature [#22](https://github.com/billchurch/bhyve-mqtt/issues/22) ([7e9886e](https://github.com/billchurch/bhyve-mqtt/commit/7e9886e633b59764af2e0f69762969e5a4bcd3cc))
* add debug 4.3.4 ([e17f01d](https://github.com/billchurch/bhyve-mqtt/commit/e17f01d8ecd2e0cb022ed0bc6e0c11534dc98320))
* break out mqtt to mqttClient.js ([91ce44b](https://github.com/billchurch/bhyve-mqtt/commit/91ce44b7068f46be7c079496b900f0541899354d))
* enhance B-Hyve MQTT integration with reconnection logic, testing, and documentation ([8e38c25](https://github.com/billchurch/bhyve-mqtt/commit/8e38c25965fd5eb25ef787bf1163ff894c9ed47e))
* enhance MQTT integration with improved configuration, validation, and error handling ([3cdfe54](https://github.com/billchurch/bhyve-mqtt/commit/3cdfe543f969bf86da4cc6065049e978e72a8cea))
* intercept SIGTERM and SIGINT to shutdown ([f789cfe](https://github.com/billchurch/bhyve-mqtt/commit/f789cfe47e175eee4cc4fece34c6ee878b48ce5d))
* switch to bhyve-api npm module ([840bd46](https://github.com/billchurch/bhyve-mqtt/commit/840bd46b335f07452078f534d068b13905d43a97))
* Update dependencies and refactor code ([359d20f](https://github.com/billchurch/bhyve-mqtt/commit/359d20ffe579e89fe630367d35766c6a06809c00))
* update modules ajv 8.13.0, bhyve-api 1.1.0, and mqtt 5.5.5 ([cf5b851](https://github.com/billchurch/bhyve-mqtt/commit/cf5b851e9f1d9c86211498122d8a7a51f559f5b8))
* upgrade ajv 8.12.0, dotenv 16.4.5, ws 8.17.0, standard 17.1.0, standard-version 9.5.0 ([1fa628f](https://github.com/billchurch/bhyve-mqtt/commit/1fa628f60de3302e534529b8a8fa4fc5302664b2))
* upgrade axios 1.6.8 and mqtt 5.5.4 ([f5e3dc7](https://github.com/billchurch/bhyve-mqtt/commit/f5e3dc7fdd9193880f66b04e265a69889d96779f))


### Bug Fixes

* deviceStatus should be initialized as a string fixes Issue 01T07:35:59.170Z - Orbit Error: TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Array [#23](https://github.com/billchurch/bhyve-mqtt/issues/23) ([8e8448e](https://github.com/billchurch/bhyve-mqtt/commit/8e8448e7a3658200e62c75027cc038655b869595))
* dotenv missing from packages ([3a61e7d](https://github.com/billchurch/bhyve-mqtt/commit/3a61e7d54d946c9fe367571e05682d138a3b3452))
* expand object when recv unexpected response ([7d172b7](https://github.com/billchurch/bhyve-mqtt/commit/7d172b7deb09d9e9c9a0cc9cb61a8d00ae77ad51))
* update axios@0.27.2, mqtt@4.3.7 ([0ae4360](https://github.com/billchurch/bhyve-mqtt/commit/0ae436033c3f344aba2cacda9239a3ad074626be))
* update dependencies and improve error handling ([2095524](https://github.com/billchurch/bhyve-mqtt/commit/209552445e15cf463249e3fb25d96cbcebc2d8e6))

## [0.1.3](https://github.com/billchurch/bhyve-mqtt/compare/bhyve-mqtt-v0.1.2...bhyve-mqtt-v0.1.3) (2025-03-04)


### Features

* add `bhyve/online` feature [#22](https://github.com/billchurch/bhyve-mqtt/issues/22) ([7e9886e](https://github.com/billchurch/bhyve-mqtt/commit/7e9886e633b59764af2e0f69762969e5a4bcd3cc))
* add debug 4.3.4 ([e17f01d](https://github.com/billchurch/bhyve-mqtt/commit/e17f01d8ecd2e0cb022ed0bc6e0c11534dc98320))
* break out mqtt to mqttClient.js ([91ce44b](https://github.com/billchurch/bhyve-mqtt/commit/91ce44b7068f46be7c079496b900f0541899354d))
* enhance B-Hyve MQTT integration with reconnection logic, testing, and documentation ([8e38c25](https://github.com/billchurch/bhyve-mqtt/commit/8e38c25965fd5eb25ef787bf1163ff894c9ed47e))
* intercept SIGTERM and SIGINT to shutdown ([f789cfe](https://github.com/billchurch/bhyve-mqtt/commit/f789cfe47e175eee4cc4fece34c6ee878b48ce5d))
* switch to bhyve-api npm module ([840bd46](https://github.com/billchurch/bhyve-mqtt/commit/840bd46b335f07452078f534d068b13905d43a97))
* Update dependencies and refactor code ([359d20f](https://github.com/billchurch/bhyve-mqtt/commit/359d20ffe579e89fe630367d35766c6a06809c00))
* update modules ajv 8.13.0, bhyve-api 1.1.0, and mqtt 5.5.5 ([cf5b851](https://github.com/billchurch/bhyve-mqtt/commit/cf5b851e9f1d9c86211498122d8a7a51f559f5b8))
* upgrade ajv 8.12.0, dotenv 16.4.5, ws 8.17.0, standard 17.1.0, standard-version 9.5.0 ([1fa628f](https://github.com/billchurch/bhyve-mqtt/commit/1fa628f60de3302e534529b8a8fa4fc5302664b2))
* upgrade axios 1.6.8 and mqtt 5.5.4 ([f5e3dc7](https://github.com/billchurch/bhyve-mqtt/commit/f5e3dc7fdd9193880f66b04e265a69889d96779f))


### Bug Fixes

* deviceStatus should be initialized as a string fixes Issue 01T07:35:59.170Z - Orbit Error: TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Array [#23](https://github.com/billchurch/bhyve-mqtt/issues/23) ([8e8448e](https://github.com/billchurch/bhyve-mqtt/commit/8e8448e7a3658200e62c75027cc038655b869595))
* dotenv missing from packages ([3a61e7d](https://github.com/billchurch/bhyve-mqtt/commit/3a61e7d54d946c9fe367571e05682d138a3b3452))
* expand object when recv unexpected response ([7d172b7](https://github.com/billchurch/bhyve-mqtt/commit/7d172b7deb09d9e9c9a0cc9cb61a8d00ae77ad51))
* update axios@0.27.2, mqtt@4.3.7 ([0ae4360](https://github.com/billchurch/bhyve-mqtt/commit/0ae436033c3f344aba2cacda9239a3ad074626be))

### 0.1.2 (2025-03-04)

### Changes
- Refactored to use the separate bhyve-api npm module (v1.1.1)
- Updated MQTT client module to use ES modules
- Improved error handling and reconnection logic
- Updated all dependencies to latest versions

### Added
- Test scripts for API, MQTT, and integration testing
- MAX_RETRIES and RECONNECT_PERIOD environment variables
- Better documentation in README

### Fixed
- Fixed template literal in publishOnline method
- Improved error handling in MQTT connection

### 0.1.1 (2022-05-10)

### Bug Fixes

* dotenv missing from packages ([3a61e7d](https://gitlab.com/https://github.com/billchurch/bhyve-mqtt/commit/3a61e7d54d946c9fe367571e05682d138a3b3452))
* update axios@0.27.2, mqtt@4.3.7 ([0ae4360](https://gitlab.com/https://github.com/billchurch/bhyve-mqtt/commit/0ae436033c3f344aba2cacda9239a3ad074626be))
