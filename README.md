# YouTube Partial Auto-Translate Extension

A Chrome extension for language learners that auto-translates a configurable percentage of YouTube caption sentences and adapts based on end-of-video feedback.

## Features
- Translates a percentage of caption sentences per video.
- Uses Google Cloud Translation API (v2) with an API key stored locally.
- End-of-video survey adjusts the translation percentage over time.
- Partial captions only show the last word to reduce spoilers.
- Options page includes a Test API Key button and a language dropdown loaded from the supported languages endpoint.

## How It Works
- Captions are monitored on YouTube pages.
- Full sentences (ending in `.`, `!`, `?`) are eligible for translation based on a deterministic percentage rule.
- Partial captions show only the last word until the sentence completes.
- At the end of a video, a survey asks whether the user fully understood the video. The percentage adjusts by a configurable step.

## Install (Developer Mode)
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` folder.
4. Open the extension **Options** and enter your Google Translate API key.

## Configuration
Available in the options page:
- Target language (dropdown loaded from Google Translate supported languages)
- Translation percentage
- Adjustment step after survey
- Minimum and maximum translation percentage
- Google Translate API key

## API Setup (Google Cloud Translation)
You must enable the Cloud Translation API and billing in your Google Cloud project, then create an API key. Add that key in the extension options.

## Files
- `extension/manifest.json`
- `extension/background.js`
- `extension/contentScript.js`
- `extension/options.html`
- `extension/options.js`
- `extension/styles.css`

## Notes
- Captions must be enabled on YouTube for this to work.
- API usage is billed by Google; monitor your quota and usage.

## Next Ideas
- Per-channel or per-video adaptation.
- A quick in-player toggle to pause translation.
