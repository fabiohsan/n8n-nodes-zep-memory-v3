# n8n-nodes-zep-memory-v3

![Zep Memory v3 Banner](https://raw.githubusercontent.com/getzep/zep/main/assets/zep-logo-light.svg)

[![npm version](https://img.shields.io/npm/v/n8n-nodes-zep-memory-v3?color=blue)](https://www.npmjs.com/package/n8n-nodes-zep-memory-v3)
[![License](https://img.shields.io/npm/l/n8n-nodes-zep-memory-v3)](https://github.com/fabiohsan/n8n-nodes-zep-memory-v3/blob/main/LICENSE.md)
[![n8n](https://img.shields.io/badge/n8n-community%20node-red)](https://n8n.io/integrations/community/nodes)

> **Supercharge your AI Agents with Zep Cloud v3 Long-Term Memory.**

This community node integrates **Zep Cloud v3** directly into your n8n workflows, providing your AI Agents with intelligent, long-term memory that goes beyond simple chat history.

---

## 🚀 Key Features

- **🧠 Intelligent Context Block**: Feeds your AI Agent with summarized user details (`USER_SUMMARY`) and extracted facts (`FACTS`), not just raw text.
- **👀 Visual Execution Logs**: See exactly what's effectively being sent and received from Zep right in the n8n Execution sidebar.
- **📉 Context Window Control**: Save costs and tokens by limiting the number of recent messages sent to the LLM (e.g., last 10), while relying on Zep's summary for long-term context.
- **⚡ Zero-Config Threading**: Automatically handles thread creation and persistence based on your `threadId`.
- **🛡️ Error Handling**: Built-in retry logic and friendly error messages for common API issues.

---

## 📦 Installation

1. Open your n8n instance.
2. Go to **Settings > Community Nodes**.
3. Select **Install**.
4. Enter the package name:
   ```bash
   n8n-nodes-zep-memory-v3
   ```
5. Install and **restart n8n**.

---

## 🛠️ Configuration

### 1. Prerequisites
- A [Zep Cloud](https://app.getzep.com) account.
- An **API Key** from your Zep Project Settings.

### 2. Setup in n8n
1. Create a **Zep Cloud API** credential in n8n and paste your API Key.
2. Add the **Zep Memory v3** node to your workflow.
3. Connect it **between** your Chat Trigger (or user input) and your AI Agent node.

| Parameter | Description | Recommended Value |
|-----------|-------------|-------------------|
| **Thread ID** | Unique identifier for the conversation session. | `{{ $json.sessionId }}` |
| **User ID** | Unique identifier for the user (optional, defaults to Thread ID). | `{{ $json.userId }}` |
| **Context Window** | Number of recent messages to inject as chat history. | `10` |
| **Use Context Block** | Whether to inject Zep's summarized context (Facts/Summary). | `True` |

---

## 📊 Visual Execution Feedback

Debug your memory flow like a pro. This node writes detailed logs to the n8n Execution Sidebar:

- **🔵 input**: Shows the parameters requesting memory (e.g., `loadMemoryVariables`).
- **🟢 output**: Shows the exact payload returned to the AI Agent (Context string + Messages array).

No more guessing what your AI "knows"!

---

## 🧩 Output Structure

The node initializes the AI Agent's memory with an object containing:

```json
{
  "context": "<USER_SUMMARY>User loves sci-fi...</USER_SUMMARY><FACTS>...</FACTS>",
  "chat_history": [
    {
      "role": "user",
      "content": "Tell me about space."
    },
    {
      "role": "assistant",
      "content": "Space is vast..."
    }
  ]
}
```

---

## ⚠️ Migration Notice

**For Open Source Users**: This node (v3+) is exclusively compatible with **Zep Cloud v3**. Support for self-hosted Zep Open Source has been discontinued to leverage the advanced features of the new v3 Cloud SDK.

---

## 🤝 Support & Contribution

Found a bug? Have a feature request?
- [Open an Issue](https://github.com/fabiohsan/n8n-nodes-zep-memory-v3/issues) on GitHub.
- Contributions are welcome! details in the repo.

Copyright © 2025 Fabio Henrique. Released under the MIT License.