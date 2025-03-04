# Source Code

This directory contains the source code for the bhyve-mqtt application.

## Main Components

- `app.js` - Main application entry point that initializes the MQTT client and Orbit API connections
- `constants.js` - Constants, default values, and utility functions
- `mqttClient.js` - MQTT client setup and message handling

## Configuration

The application requires configuration via environment variables. See the main README.md for details on required environment variables.

## Development

When making changes to this codebase:

1. Follow the existing code style
2. Use ES module imports (`import`/`export`)
3. Make small, focused commits with clear messages
4. Test changes locally before pushing

## Testing

Run tests by starting the application with test credentials or by using the test scripts.
