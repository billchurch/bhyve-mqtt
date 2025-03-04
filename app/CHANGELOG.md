# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
