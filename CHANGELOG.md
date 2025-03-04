# Change Log

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
