---
"@sajari/sdk-js": patch
---

Fix undefined activePins causes a fatal error. This can happen if a promotion has no pins so the activePins will not appear in the response.
