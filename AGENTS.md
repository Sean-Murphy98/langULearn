# Repository Guidelines

## Project Structure & Module Organization
- `extension/` contains the Chrome extension source.
- `extension/contentScript.js` handles caption interception and UI behavior.
- `extension/background.js` handles translation API calls.
- `extension/options.html`, `extension/options.js`, `extension/styles.css` implement the options page.
- `extension/icons/` stores extension icons.
- `README.md` documents usage.

## Build, Test, and Development Commands
- No build step is required. Load the extension directly in Chrome:
  - Open `chrome://extensions`, enable Developer mode, and load `extension/`.
- There are no automated tests or dev servers yet.

## Coding Style & Naming Conventions
- Use 2-space indentation in JSON and JavaScript.
- Prefer `camelCase` for variables and functions.
- Keep DOM data attributes prefixed with `pat` (e.g., `data-pat-processed`).
- Keep changes minimal and readable; avoid introducing dependencies unless necessary.

## Testing Guidelines
- No test framework is set up.
- If you add tests, document how to run them in `README.md` and keep test names descriptive (e.g., `captionTranslation.test.js`).

## Commit & Pull Request Guidelines
- Recent commits use short, imperative messages like “Added readme” or “Switched to Google translate api.”
- Keep commit subjects concise and action-oriented.
- For PRs, include:
  - A short summary of behavior changes.
  - Screenshots or a short clip if UI behavior changes.
  - Any API or configuration changes (e.g., new options or keys).

## Security & Configuration Tips
- API keys are stored in `chrome.storage.local` via the options page.
- Avoid committing keys or secrets; keep them local to the browser.
