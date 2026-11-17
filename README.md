# JadeWeb

JadeWeb is a browser-based video production studio inspired by OBS. It provides scene/source management, display and camera capture, microphone access, compositing, WebM recording, and a polished Edge-compatible interface.

## Run locally

Requires Node.js 20+

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in a current Microsoft Edge browser.

## Browser features

- Screen/window capture: `getDisplayMedia()`
- Webcam and microphone: `getUserMedia()`
- Composited local recording: `MediaRecorder` / WebM
- Scene and source persistence: `localStorage`
- Drag positioning and source visibility/locking
- Text, image, video, browser, and colour sources

## Backend-required features

RTMP/SRT streaming and long-lived secure stream-key storage require a server. Browser JavaScript cannot expose a stream key safely or provide OBS-grade transport by itself. Use an authenticated backend to validate sessions and connect to RTMP/SRT via FFmpeg, WHIP/WHEP, or an owned relay service.

## Notes

- Screen capture may require an HTTPS origin or localhost.
- Browser sources may be blocked by Content-Security-Policy or iframe policies.
- Media playback and capture require appropriate browser permissions.
- The current recording compositing is a canvas-based preview implementation and downloads a WebM file.
