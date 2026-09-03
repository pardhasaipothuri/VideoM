# AI provider architecture

`providers.js` exposes a dependency-free interface for future integrations. Implement any function with your own server/API/local model adapter, then inject it into the app. The editor itself never requires an AI API key.
