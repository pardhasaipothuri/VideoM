# AI Anime Video Maker

A browser-only anime / visual-novel video editor built with React, Vite and FFmpeg WebAssembly. Upload still images, give each scene timing, voice and subtitles, add music, transitions and camera motion, then render an MP4 directly in Chrome.

## Features
- Multi-scene anime editor with drag-and-drop reordering.
- Scene duration, name, voice, dialogue, volume and transition controls.
- CSS 2.5D preview: zoom, pan, rotation and shake.
- Per-scene voice preview and project-wide background music.
- Subtitle styling with position, size and background controls.
- Cut, fade, fade-to-black and crossfade-style transitions.
- 1280x720 / 1920x1080, 16:9 / 9:16, 24 / 30 / 60 FPS settings.
- Browser-side MP4 rendering using FFmpeg WebAssembly; no backend is required.
- JSON project save/load without embedding media bytes.
- Character library for reusable character metadata.
- Provider interfaces ready for future AI image, voice, music and script integrations.

## Run locally
1. Install a current Node.js LTS release.
2. In this folder run `npm install`.
3. Run `npm run dev`.
4. Open the local URL shown by Vite in Chrome.

## GitHub
Create a repository, then upload the contents of this folder (including `package.json`). Do not upload `node_modules` or `dist`.

## Vercel
Import the GitHub repository into Vercel. The project is a standard Vite app:
- Build command: `npm run build`
- Output directory: `dist`
- No serverless function is required.

Vercel can also detect these automatically.

## How to use
1. Click **Add Scene** or use **Add images** to create multiple scenes.
2. Select a scene and configure duration, animation, transition, voice and subtitle settings in the right panel.
3. Use the timeline to select and drag scenes into a new order.
4. Add optional background music in Project Settings.
5. Click **Preview** to play the complete project timeline. The preview uses HTML/CSS transforms and synchronized audio.
6. Click **Render MP4**. The app loads FFmpeg WASM in the browser, creates an animated video for each scene, joins them, mixes audio/music, and produces a downloadable MP4.

## Rendering notes
FFmpeg WebAssembly runs inside the browser. User media is processed locally and is not uploaded by this app. The FFmpeg core is fetched from the jsDelivr package CDN the first time rendering is used; after loading, encoding itself happens locally.

Rendering is CPU/RAM intensive. 1080p/60 FPS and long projects can be especially demanding. On a weaker laptop, prefer 720p/24 or 30 FPS and render shorter sections. Browser memory limits can vary by Chrome version and device.

### Voice timing
If a voice file is longer than the scene duration, the editor warns you. Rendering trims audio to the scene duration. If it is shorter, the scene continues silently for the remaining time.

### Project JSON limitation
The JSON project file stores scene metadata and media names, not the binary image/audio files. Browser object URLs only exist for the current browser session. After loading a JSON later, you should reselect/re-upload the referenced media files. The editor reports which assets are missing.

## Future AI providers
`src/ai/providers.js` defines provider interfaces such as `generateImage`, `generateVoice`, `generateMusic`, `generateScript`, and `generateScene`. The basic editor does not require API keys. A future provider can implement these functions and connect to your own API or local model.

## Browser support
Designed for current desktop Google Chrome. FFmpeg WASM requires browser features such as WebAssembly, workers and IndexedDB/Blob APIs. Large projects can hit browser memory limits.

## License
MIT for this project code. FFmpeg WebAssembly and its bundled codecs remain subject to their respective licenses; review the upstream project before distributing a modified build.
