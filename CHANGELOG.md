# Change Log

## [0.3.3](https://github.com/billchurch/bhyve-mqtt/compare/v0.3.2...v0.3.3) (2026-06-09)


### Bug Fixes

* **docker:** use node:22-alpine to restore 32-bit ARM builds ([631b04f](https://github.com/billchurch/bhyve-mqtt/commit/631b04fdb48c93e89d9d09b7f758038e5c4e112a))

## [0.3.2](https://github.com/billchurch/bhyve-mqtt/compare/v0.3.1...v0.3.2) (2026-06-09)


### Bug Fixes

* **deps:** update bhyve-api to 1.2.4 and resolve npm audit vulnerabilities ([ac72a01](https://github.com/billchurch/bhyve-mqtt/commit/ac72a0161ce418d5713945eebe052302ba754a67))

## [0.3.1](https://github.com/billchurch/bhyve-mqtt/compare/v0.3.0...v0.3.1) (2025-10-07)


### Bug Fixes

* handle WebSocket reconnection failures to prevent DNS query spikes ([ca32981](https://github.com/billchurch/bhyve-mqtt/commit/ca329810bab35e748f92d39c0bf916556b1f6444))
* WebSocket reconnection failures causing DNS query spikes ([59bf74f](https://github.com/billchurch/bhyve-mqtt/commit/59bf74f5b2d3a436e37c9eca4f7c7c8f081491ff))

## [0.3.0](https://github.com/billchurch/bhyve-mqtt/compare/v0.2.6...v0.3.0) (2025-03-04)


### Features

* upgrade bhyve-api to v1.2.0 ([3b6e897](https://github.com/billchurch/bhyve-mqtt/commit/3b6e8977f6c0df22009feaff93c4dc60237c99ef))

## [0.2.6](https://github.com/billchurch/bhyve-mqtt/compare/v0.2.5...v0.2.6) (2025-03-04)


### Bug Fixes

* docker publish with proper tags ([6eb3aa4](https://github.com/billchurch/bhyve-mqtt/commit/6eb3aa4dc71f9d4b9677b1ad63d6af925f53eb1c))

## [0.2.5](https://github.com/billchurch/bhyve-mqtt/compare/v0.2.4...v0.2.5) (2025-03-04)


### Bug Fixes

* container tagging ([b9ccd7f](https://github.com/billchurch/bhyve-mqtt/commit/b9ccd7f4263794221fdca2fb18c028a7eff14e6b))

## [0.2.4](https://github.com/billchurch/bhyve-mqtt/compare/v0.2.3...v0.2.4) (2025-03-04)


### Bug Fixes

* update docker platforms ([aa02a45](https://github.com/billchurch/bhyve-mqtt/commit/aa02a4559bb5a15b64a461b7ad6fa9376e4d6adb))

## [0.2.3](https://github.com/billchurch/bhyve-mqtt/compare/v0.2.2...v0.2.3) (2025-03-04)


### Bug Fixes

* container publishing ([5641474](https://github.com/billchurch/bhyve-mqtt/commit/5641474daceef553fcef0dad29057ca5bba09e90))

## [0.2.2](https://github.com/billchurch/bhyve-mqtt/compare/v0.2.1...v0.2.2) (2025-03-04)


### Bug Fixes

* update container images ([b983c2f](https://github.com/billchurch/bhyve-mqtt/commit/b983c2fe651a536196c2d72f36ffeaf3017f6c11))
* update package contents ([17924e2](https://github.com/billchurch/bhyve-mqtt/commit/17924e2716f3b32f4809186a10e89607e42629e9))

## [0.2.1](https://github.com/billchurch/bhyve-mqtt/compare/v0.2.0...v0.2.1) (2025-03-04)


### Bug Fixes

* remove extra stuff from npm ([1f95b6d](https://github.com/billchurch/bhyve-mqtt/commit/1f95b6d81ccad91ad38797bbf730a13b9d349dbb))

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
