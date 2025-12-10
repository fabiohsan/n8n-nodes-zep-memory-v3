# Migration Guide: v0.2.x → v0.3.0

## Overview

Version 0.3.0 introduces breaking changes to simplify the codebase and provide better AI Agent support through Zep's Context Block.

## Breaking Changes

### 1. Open Source Support Removed

**Before (v0.2.x):**
- Supported both Zep Cloud and Zep Open Source
- Required "Cloud" toggle in credentials
- Different authentication headers for each

**After (v0.3.0):**
- Only Zep Cloud v3 is supported
- Simpler credentials (just API Key)
- Zep Open Source was [deprecated by Zep in April 2025](https://www.getzep.com/)

### 2. New Output Format

**Before (v0.2.x):**
```json
{
  "chat_history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**After (v0.3.0):**
```json
{
  "context": "<USER_SUMMARY>...</USER_SUMMARY><FACTS>...</FACTS>",
  "messages": [/* last 6 messages */],
  "chat_history": [/* all messages - backward compatibility */]
}
```

The new `context` field contains Zep's Context Block with:
- `<USER_SUMMARY>`: AI-generated summary of the user
- `<FACTS>`: Relevant facts with temporal ranges

### 3. Credentials Simplified

**Before (v0.2.x):**
- API Key
- Cloud (boolean toggle)
- API URL (for Open Source)

**After (v0.3.0):**
- API Key only

## Migration Steps

### If Using Zep Cloud

1. **Update the node package:**
   ```bash
   # In n8n Settings > Community Nodes
   # Uninstall and reinstall n8n-nodes-zep-memory-v3
   ```

2. **Update credentials:**
   - Delete old Zep API credentials
   - Create new "Zep Cloud API" credentials
   - Enter only your API Key

3. **Update workflows (optional):**
   - Your workflows will continue to work (chat_history is preserved)
   - To use new features, access `{{ $json.context }}` for the Context Block

### If Using Zep Open Source

Unfortunately, Zep Open Source was deprecated in April 2025. You need to:

1. **Migrate to Zep Cloud:**
   - Create account at [app.getzep.com](https://app.getzep.com)
   - Export your data from Open Source (if possible)
   - Import to Zep Cloud

2. **Or stay on v0.2.3:**
   - v0.2.3 will remain available on npm
   - Install specific version: `n8n-nodes-zep-memory-v3@0.2.3`
   - Note: No further updates or support

## Need Help?

- [GitHub Issues](https://github.com/fabiohsan/n8n-nodes-zep-memory-v3/issues)
- [Zep Documentation](https://help.getzep.com)
- [n8n Community](https://community.n8n.io)
