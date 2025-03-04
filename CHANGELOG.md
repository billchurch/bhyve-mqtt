# Change Log

## [0.2.0](https://github.com/billchurch/bhyve-mqtt/compare/v0.1.4...v0.2.0) (2025-03-04)


### Features

* improve Dockerfile and add .dockerignore ([89a2f1f](https://github.com/billchurch/bhyve-mqtt/commit/89a2f1fde6894d8e594b556087fc1fb642339c44))


### Bug Fixes

* adjust Dockerfile and release workflow for correct app location ([43f7415](https://github.com/billchurch/bhyve-mqtt/commit/43f7415dd445de9737745a8b8272f0ea42172edf))
* build system ([5eb38c2](https://github.com/billchurch/bhyve-mqtt/commit/5eb38c289318b55c76337bbb3351c2fb093392ae))
* build system - automation is fun ([a985adc](https://github.com/billchurch/bhyve-mqtt/commit/a985adc84c9a3d0d306dd70b3b158a852b9cf13a))

## [0.1.1] - 2025-03-04
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

## [0.1.0] - 2023
### Changes
- Move app files into sub-directory

### Fixes
- Include dotenv module for configuration parsing
- topic bhyve/device/xx/message thanks @jimtng

### Added
- initial Dockerfile
