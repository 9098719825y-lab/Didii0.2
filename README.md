# SHUBHRA AI — PWA prototype

Hindi/Hinglish voice UI with speech synthesis, optional browser speech recognition, installable PWA support, service worker caching, and a configurable compatible chat-completions API endpoint.

## Publish on GitHub Pages
1. Upload every file and the `icons` folder to the repository root.
2. GitHub repo → Settings → Pages → Deploy from a branch → `main` → `/(root)` → Save.
3. Open the published HTTPS URL in Android Chrome.

## AI configuration
This app is **not a fully working AI out of the box**. It needs a compatible HTTPS API endpoint and, where required, a model name and API key. Open **AI Settings** inside the app.
- Endpoint must accept a JSON body with `messages` and return a chat-completions-style `choices[0].message.content` response, or one of the supported simple response fields.
- Browser requests require CORS support from the API server.
- Do not put a private API key in a public GitHub repository. The settings screen stores a key in that browser's local storage, which is not appropriate for shared/public devices. For production, use a private serverless/backend proxy that keeps secrets server-side.
- The “Connection test” sends a test message and reports the result.

## Important limits
Speech recognition support varies by browser/device and may require an internet connection. Text chat works even without microphone support. AI requests require internet. The demo fallback only responds to a few basic commands; it is not an AI model.
