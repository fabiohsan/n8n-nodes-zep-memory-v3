import {
	ISupplyDataFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
	NodeOperationError,
} from 'n8n-workflow';

// Zep Cloud SDK - use namespace import for compatibility
import * as ZepCloud from '@getzep/zep-cloud';


/**
 * Error messages mapping for user-friendly feedback
 */
const ERROR_MESSAGES: Record<number, string> = {
	401: 'Authentication failed. Please check your Zep API Key.',
	403: 'Access forbidden. Your API Key may not have permission for this operation.',
	404: 'Thread not found. It will be created automatically.',
	429: 'Rate limit exceeded. Please wait a moment and try again.',
	500: 'Zep server error. Please check https://status.getzep.com',
};

/**
 * Maps SDK errors to user-friendly messages
 */
function mapError(error: any, node: any): NodeOperationError {
	const status = error.status || error.response?.status;
	const message = ERROR_MESSAGES[status] || error.message || 'An unexpected error occurred';

	return new NodeOperationError(node, message, {
		description: `HTTP ${status || 'Unknown'}: ${error.message || 'No details available'}`,
	});
}

/**
 * Zep Memory Wrapper - Interfaces with Zep Cloud SDK
 * Implements the memory interface expected by n8n AI Agents
 */
class ZepMemoryWrapper {
	private client: any; // ZepCloud.ZepClient
	private threadId: string;
	private logger?: any;

	constructor(client: any, threadId: string, logger?: any) {
		this.client = client;
		this.threadId = threadId;
		this.logger = logger;
	}

	private log(level: 'info' | 'debug' | 'error', message: string, meta?: any) {
		if (this.logger && typeof this.logger[level] === 'function') {
			this.logger[level](message, meta);
		}
	}

	/**
	 * Load memory variables - retrieves context from Zep
	 * Returns structured Context Block with USER_SUMMARY and FACTS
	 */
	async loadMemoryVariables(_values: any) {
		this.log('debug', `Loading memory for thread: ${this.threadId}`);

		try {
			// Get user context (Context Block with USER_SUMMARY + FACTS)
			const memory = await this.client.thread.getUserContext(this.threadId);

			// Get recent messages for chat_history compatibility
			const thread = await this.client.thread.get(this.threadId);
			const messages = thread.messages || [];

			// Format messages for LangChain compatibility
			const chatHistory = messages.map((msg: any) => ({
				role: msg.role === 'human' ? 'user' : msg.role,
				content: msg.content || '',
				name: msg.name,
			})).filter((m: any) => m.content.trim());

			this.log('debug', `Loaded ${chatHistory.length} messages from thread`);

			return {
				// New v0.3.0 structured output
				context: memory.context || '',
				messages: chatHistory.slice(-6), // Last 6 messages (recommended by Zep)

				// Backward compatibility alias
				chat_history: chatHistory,
			};
		} catch (error: any) {
			// If thread doesn't exist, return empty context
			if (error.status === 404) {
				this.log('debug', 'Thread not found, returning empty context');
				return {
					context: '',
					messages: [],
					chat_history: [],
				};
			}
			throw error;
		}
	}

	/**
	 * Save context - adds messages to Zep thread
	 */
	async saveContext(inputValues: any, outputValues: any) {
		this.log('debug', `Saving context to thread: ${this.threadId}`);

		const messages = [];

		// Add user message
		if (inputValues?.input) {
			messages.push({
				role: 'human' as const,
				content: String(inputValues.input),
			});
		}

		// Add assistant message
		if (outputValues?.output) {
			messages.push({
				role: 'ai' as const,
				content: String(outputValues.output),
			});
		}

		if (messages.length === 0) {
			this.log('debug', 'No messages to save');
			return;
		}

		try {
			await this.client.thread.addMessages(this.threadId, messages);
			this.log('debug', `Saved ${messages.length} messages to thread`);
		} catch (error: any) {
			// If thread doesn't exist, create it first
			if (error.status === 404) {
				this.log('debug', 'Thread not found, creating...');
				await this.client.thread.create({ threadId: this.threadId });
				await this.client.thread.addMessages(this.threadId, messages);
				this.log('debug', 'Thread created and messages saved');
			} else {
				throw error;
			}
		}
	}

	/**
	 * Clear memory - deletes the thread
	 */
	async clear() {
		this.log('debug', `Clearing thread: ${this.threadId}`);
		try {
			await this.client.thread.delete(this.threadId);
			this.log('debug', 'Thread deleted');
		} catch (error: any) {
			if (error.status !== 404) {
				throw error;
			}
			// Thread already doesn't exist, that's fine
		}
	}

	// Required properties for LangChain compatibility
	get memoryKey() { return 'chat_history'; }
	get returnMessages() { return true; }
	get inputKey() { return 'input'; }
	get outputKey() { return 'output'; }
}

/**
 * Zep Memory v3 - n8n Community Node
 * Provides persistent memory for AI Agents using Zep Cloud
 * 
 * v0.3.0 - Cloud-only with native SDK
 */
export class ZepMemory implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zep Memory v3',
		name: 'zepMemoryV3',
		icon: 'file:zep.png',
		group: ['transform'],
		version: [1, 2, 3, 4, 5], // v5 = new SDK implementation
		description: 'Use Zep Cloud v3 for AI agent memory with Context Block',
		defaults: {
			name: 'Zep Memory v3',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Memory'],
				Memory: ['Other memories'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://help.getzep.com',
					},
				],
			},
		},
		inputs: [],
		outputs: ['ai_memory'],
		outputNames: ['Memory'],
		credentials: [
			{
				name: 'zepApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Connect to AI Agent',
				name: 'connectionHint',
				type: 'notice',
				default: '',
				description: 'Connect this node to an AI Agent node to provide memory functionality',
			},
			{
				displayName: 'Zep Cloud v3 - Context Block with USER_SUMMARY and FACTS',
				name: 'supportedVersions',
				type: 'notice',
				default: '',
			},
			// Thread ID for version 1
			{
				displayName: 'Thread ID',
				name: 'threadId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						'@version': [1],
					},
				},
			},
			// Thread ID for version 2
			{
				displayName: 'Thread ID',
				name: 'threadId',
				type: 'string',
				default: '={{ $json.threadId }}',
				description: 'The thread ID to use to store the memory',
				displayOptions: {
					show: {
						'@version': [2],
					},
				},
			},
			// Thread ID Type for versions 3+
			{
				displayName: 'Thread ID',
				name: 'threadIdType',
				type: 'options',
				options: [
					{
						name: 'Connected Chat Trigger Node',
						value: 'fromInput',
						description: 'Looks for an input field called "threadId" from a connected Chat Trigger',
					},
					{
						name: 'Define below',
						value: 'customKey',
						description: 'Use an expression to reference data in previous nodes or enter static text',
					},
				],
				default: 'fromInput',
				displayOptions: {
					show: {
						'@version': [{ _cnd: { gte: 3 } }],
					},
				},
			},
			// Thread Key From Previous Node (version 4+)
			{
				displayName: 'Thread Key From Previous Node',
				name: 'threadKey',
				type: 'string',
				default: '={{ $json.threadId }}',
				displayOptions: {
					show: {
						threadIdType: ['fromInput'],
						'@version': [{ _cnd: { gte: 4 } }],
					},
				},
			},
			// Custom Thread Key
			{
				displayName: 'Key',
				name: 'threadKey',
				type: 'string',
				default: '',
				description: 'The key to use to store thread ID in the memory',
				displayOptions: {
					show: {
						threadIdType: ['customKey'],
					},
				},
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		// Logging helper using n8n's logger
		const log = (level: 'info' | 'debug' | 'error', message: string, meta?: any) => {
			if (this.logger && typeof this.logger[level] === 'function') {
				this.logger[level](message, meta);
			}
		};

		log('info', 'Zep Memory v3 - Initializing');

		// Get credentials
		const credentials = await this.getCredentials('zepApi');

		if (!credentials.apiKey) {
			throw new NodeOperationError(
				this.getNode(),
				'API Key is required. Please configure your Zep Cloud credentials.'
			);
		}

		// Get node version
		const nodeVersion = this.getNode().typeVersion;
		log('debug', `Node version: ${nodeVersion}`);

		// Get thread ID based on node version
		let threadId: string;

		if (nodeVersion >= 3) {
			const threadIdType = this.getNodeParameter('threadIdType', itemIndex) as string;
			if (threadIdType === 'fromInput') {
				const threadKey = this.getNodeParameter('threadKey', itemIndex, 'threadId') as string;
				const inputData = this.getInputData();
				const currentItem = inputData[itemIndex];
				threadId = String(currentItem?.json?.[threadKey] || '');
				log('debug', `Thread ID from input: ${threadId}`);
			} else {
				threadId = this.getNodeParameter('threadKey', itemIndex) as string;
				log('debug', `Thread ID from custom key: ${threadId}`);
			}
		} else {
			threadId = this.getNodeParameter('threadId', itemIndex) as string;
			log('debug', `Thread ID (legacy): ${threadId}`);
		}

		if (!threadId) {
			throw new NodeOperationError(
				this.getNode(),
				'Thread ID is required. Please provide a valid thread ID.'
			);
		}

		log('info', `Using thread ID: ${threadId}`);

		// Initialize Zep Cloud client
		const ZepClient = ZepCloud.ZepClient || (ZepCloud as any).default || ZepCloud;
		const client = new ZepClient({
			apiKey: credentials.apiKey as string,
		});

		// Create memory wrapper
		const memory = new ZepMemoryWrapper(client, threadId, this.logger);

		log('info', 'Zep Memory v3 initialized successfully');

		return {
			response: memory,
		};
	}
}