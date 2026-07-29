# Workspace Guidelines for Kumamoto Dashboard

## Auto Git Push Rule
- **Mandatory Git Sync**: Whenever 3-5 code changes or a major feature update is completed in this repository, automatically stage, commit, and push the changes to GitHub (`git add .`, `git commit -m "..."`, `git push origin main`).
- **No Manual Prompting**: Do NOT ask the user if they want to push. Execute `git push` autonomously to ensure GitHub Pages and mobile viewers always see the latest live updates immediately.

## Information Display Principle
- **Intuitive First**: All information MUST be presented in the most visual and intuitive format possible (tables, color-coded badges, icons). Users should understand the status at a glance without reading long paragraphs.
- **Always Cite Sources**: Every data block MUST include a clickable source link (e.g., "資料來源：JR九州 官方公告 →") so viewers can verify the information themselves. Never show data without attribution.
- **No Click-Through Required**: Embed content directly on the page. Do NOT use iframes, Google Docs Viewer, or force users to click external links to see the actual information.
