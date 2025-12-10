# n8n-nodes-zep-memory-v3

![n8n.io - Workflow Automation](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-logo.png)

Community node for **Zep Cloud v3** Memory - provides persistent memory for AI Agents with structured Context Block.

> ⚠️ **v0.3.0 Breaking Change**: Open Source support has been removed. This version only supports Zep Cloud v3.

## Features

- **Context Block**: Returns structured USER_SUMMARY + FACTS (not just chat history)
- **Zep Cloud v3**: Uses native SDK for optimal performance
- **Thread-based Memory**: Uses Zep v3 thread terminology
- **Auto Thread Creation**: Automatically creates threads if they don't exist
- **Error Mapping**: User-friendly error messages for common issues (401, 404, 429)
- **AI Agent Integration**: Direct integration with n8n AI Agent nodes

## Installation

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-zep-memory-v3`
4. Agree to the risks of using community nodes
5. Select **Install**

After installation, restart n8n to see the node in the nodes panel.

## Configuration

### Credentials

1. Create a [Zep Cloud account](https://app.getzep.com)
2. Get your **API Key** from the dashboard
3. In n8n, create new **Zep Cloud API** credentials
4. Enter your **API Key**

### Node Configuration

- **Thread ID**: The unique identifier for the conversation thread
  - Can use expressions like `{{ $json.threadId }}`
  - Supports different input methods based on node version

## Usage

1. Add the **Zep Memory v3** node to your workflow
2. Connect it between your **Chat Trigger** and **AI Agent** nodes
3. Configure the **Thread ID** to identify unique conversations
4. The node will automatically:
   - Load Context Block (USER_SUMMARY + FACTS) for the AI Agent
   - Save new messages after AI responses
   - Create threads automatically if they don't exist

### Example Workflow

```
Chat Trigger → Zep Memory v3 → AI Agent → Response
```

### Output Format

The node returns:

```json
{
  "context": "<USER_SUMMARY>...</USER_SUMMARY><FACTS>...</FACTS>",
  "messages": [/* last 6 messages */],
  "chat_history": [/* all messages - backward compatibility */]
}
```

## Migration from v0.2.x

If you were using Zep Open Source, you need to migrate to Zep Cloud:

1. Create a [Zep Cloud account](https://app.getzep.com)
2. Update your credentials to use only the API Key
3. Your existing workflows will continue to work

## Compatibility

- **n8n version**: 0.190.0 and above
- **Node.js**: 18.10 and above
- **Zep**: Cloud v3 only (Open Source no longer supported)

## Support

This is a community-maintained node. For issues:

1. Check the [GitHub Issues](https://github.com/fabiohsan/n8n-nodes-zep-memory-v3/issues)
2. Create a new issue with detailed information
3. Community support via n8n Discord

## License

[MIT](https://github.com/fabiohsan/n8n-nodes-zep-memory-v3/blob/main/LICENSE.md)

## Resources

- [Zep Documentation](https://help.getzep.com)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [n8n Documentation](https://docs.n8n.io)