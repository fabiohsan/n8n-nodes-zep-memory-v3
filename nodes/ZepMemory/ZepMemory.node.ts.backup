import {
	ISupplyDataFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
	NodeOperationError,
} from 'n8n-workflow';

// Zep Cloud SDK - ZepClient is the main constructor
import { ZepClient } from '@getzep/zep-cloud';


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
	private userId: string;
	private logger?: any;

	constructor(client: any, threadId: string, userId: string, logger?: any) {
		this.client = client;
		this.threadId = threadId;
		this.userId = userId || threadId; // Default to threadId if userId not provided
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
			// First, ensure the thread exists
			await this.ensureThreadExists();

			// Get user context
			let contextBlock = '';
			try {
				// SDK Signature: getUserContext(threadId: string)
				this.log('debug', `Calling getUserContext with string: ${this.threadId}`);
				const memory = await this.client.thread.getUserContext(this.threadId);
				contextBlock = memory?.context || '';
			} catch (ctxError: any) {
				this.log('debug', `getUserContext failed: ${ctxError.message}`);
				contextBlock = '';
			}

			// Get recent messages
			let chatHistory: any[] = [];
			try {
				// SDK Signature: get(threadId: string)
				this.log('debug', `[DEBUG] Calling thread.get with string: ${this.threadId}`);
				const thread = await this.client.thread.get(this.threadId);
				const messages = thread?.messages || [];

				// DEBUG A: RAW ZEP MESSAGES
				this.log('info', '=== DEBUG: RAW ZEP MESSAGES ===');
				this.log('info', `Total raw messages from Zep: ${messages.length}`);
				messages.forEach((msg: any, idx: number) => {
					this.log('info', `[RAW ${idx}] ${JSON.stringify({
						role: msg.role,
						contentPreview: (typeof msg.content === 'string' ? msg.content.substring(0, 50) + '...' : typeof msg.content),
						allKeys: Object.keys(msg),
						hasAuthor: 'author' in msg,
						author: msg.author ?? null
					})}`);
				});

				// Define role mapping
				const roleToType: Record<string, string> = {
					'user': 'human',
					'human': 'human',
					'assistant': 'ai',
					'ai': 'ai',
					'system': 'system',
					'tool': 'tool',
					'function': 'function',
				};

				chatHistory = messages
					.filter((msg: any) => {
						// Filter: valid content
						if (!msg || typeof msg.content !== 'string' || msg.content.trim() === '') {
							this.log('debug', 'Filtering message: empty or invalid content');
							return false;
						}
						const role = (msg.role || '').toString().toLowerCase();
						if (!role) {
							this.log('debug', 'Filtering message: no role defined');
							return false;
						}

						// Filter tool and function messages (Strategy A)
						if (['tool', 'function'].includes(role)) {
							this.log('debug', `[DEBUG] Filtering tool message type: ${role}`);
							return false;
						}

						// Filter system messages from history
						if (role === 'system') {
							this.log('debug', '[DEBUG] Filtering system message from history');
							return false;
						}

						return true;
					})
					.map((msg: any) => {
						const originalRole = (msg.role || 'user').toString().toLowerCase();
						let mappedRole = roleToType[originalRole] ?? 'human';

						if (!roleToType[originalRole]) {
							this.log('info', `[WARN] Unknown role encountered: "${msg.role}", defaulting to 'human'`);
						}

						const message: any = {
							role: mappedRole,
							type: mappedRole,
							content: (typeof msg.content === 'string') ? msg.content : (msg.content ?? ''),
						};

						// CRITICAL: ensure author compatible with executeBatch.ts
						if (mappedRole === 'human') message.author = 'user';
						else if (mappedRole === 'ai') message.author = 'assistant';
						else message.author = mappedRole;

						if (msg.name && typeof msg.name === 'string' && msg.name.trim()) {
							message.name = msg.name;
						}

						if (msg.additional_kwargs && typeof msg.additional_kwargs === 'object' && Object.keys(msg.additional_kwargs).length) {
							message.additional_kwargs = msg.additional_kwargs;
						}

						this.log('debug', `Mapped: ${originalRole} -> role=${mappedRole}, author=${message.author}`);
						return message;
					});

				// DEBUG B: AFTER filter/map
				this.log('info', '=== DEBUG: FINAL MAPPED MESSAGES ===');
				this.log('info', `Total mapped messages: ${chatHistory.length}`);
				chatHistory.forEach((msg, idx) => {
					this.log('info', `[MAPPED ${idx}] ${JSON.stringify({
						role: msg.role,
						type: msg.type,
						author: msg.author,
						contentPreview: (typeof msg.content === 'string' ? msg.content.substring(0, 50) + '...' : typeof msg.content),
						allKeys: Object.keys(msg)
					})}`);
				});

				// Validation (Defensive)
				chatHistory = chatHistory.filter((msg, idx) => {
					const hasRole = typeof msg.role === 'string' && msg.role.trim() !== '';
					const hasType = typeof msg.type === 'string' && msg.type.trim() !== '';
					const hasContent = msg.content !== undefined && msg.content !== null;
					const hasAuthor = typeof msg.author === 'string' && msg.author.trim() !== '';

					const isValid = hasRole && hasType && hasContent && hasAuthor;

					if (!isValid) {
						this.log('error', `[CRITICAL] Message ${idx} FAILED validation: ${JSON.stringify({
							hasRole, hasType, hasContent, hasAuthor, message: msg
						})}`);
					}
					return isValid;
				});

				this.log('info', `Final validated messages count: ${chatHistory.length}`);

			} catch (getError: any) {
				this.log('debug', `[DEBUG] thread.get failed: ${getError.message}`);
				chatHistory = [];
			}

			// DEBUG C: RETURN STRUCTURE
			this.log('info', '=== DEBUG: RETURN STRUCTURE ===');
			this.log('info', `chat_history array length: ${chatHistory.length}`);
			this.log('info', `First message structure: ${chatHistory.length > 0 ? JSON.stringify(chatHistory[0]) : 'empty'}`);

			return {
				chat_history: chatHistory,
			};
		} catch (error: any) {
			this.log('error', `Error in loadMemoryVariables: ${error.message}`);
			const status = error.status || error.statusCode || error.response?.status;
			const message = error.message || '';

			if (status === 404 || message.includes('404') || message.includes('not found')) {
				return { chat_history: [] };
			}
			throw error;
		}
	}

	private async ensureThreadExists() {
		try {
			// SDK Signature: get(threadId: string)
			this.log('debug', `Checking thread exists with string: ${this.threadId}`);
			await this.client.thread.get(this.threadId);
			this.log('debug', 'Thread exists');
		} catch (error: any) {
			const status = error.status || error.statusCode || error.response?.status;
			const message = error.message || '';

			if (status === 404 || message.includes('404') || message.includes('not found')) {
				this.log('debug', 'Thread not found, creating user and thread...');
				try {
					try {
						// SDK Signature: user.add(request: object) - CORRECT
						const userParams = { userId: this.userId };
						this.log('debug', `Creating user with: ${JSON.stringify(userParams)}`);
						await this.client.user.add(userParams);
						this.log('debug', `User ${this.userId} created`);
					} catch (userError: any) {
						this.log('debug', `User creation skipped: ${userError.message}`);
					}

					// SDK Signature: thread.create(request: object) - CORRECT
					const threadParams = { threadId: this.threadId, userId: this.userId };
					this.log('debug', `Creating thread with: ${JSON.stringify(threadParams)}`);
					await this.client.thread.create(threadParams);
					this.log('debug', 'Thread created successfully');
				} catch (createError: any) {
					this.log('debug', `Could not create thread: ${createError.message}`);
				}
			}
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
				role: 'user' as const,
				content: String(inputValues.input),
				roleType: 'human',
			});
		}

		// Add assistant message
		if (outputValues?.output) {
			messages.push({
				role: 'assistant' as const,
				content: String(outputValues.output),
				roleType: 'ai',
			});
		}

		if (messages.length === 0) {
			this.log('debug', 'No messages to save');
			return;
		}

		// DEBUG: Log messages to save
		this.log('debug', `Messages to save: ${JSON.stringify(messages)}`);

		try {
			// SDK Signature: addMessages(threadId, request) - Mixed
			const params = { messages };
			this.log('debug', `Calling addMessages with string: ${this.threadId}, object: ${JSON.stringify(params)}`);
			await this.client.thread.addMessages(this.threadId, params);
			this.log('debug', `Saved ${messages.length} messages to thread`);
		} catch (error: any) {
			this.log('error', `addMessages failed: ${error.message}`);

			// If thread doesn't exist, create it first
			const status = error.status || error.statusCode || error.response?.status;
			const message = error.message || '';

			if (status === 404 || message.includes('404') || message.includes('not found')) {
				this.log('debug', 'Thread not found, creating user and thread...');
				try {
					try {
						await this.client.user.add({ userId: this.userId });
					} catch (userError: any) {
						// User might already exist, ignore
					}

					await this.client.thread.create({
						threadId: this.threadId,
						userId: this.userId
					});

					// Retry addMessages
					this.log('debug', 'Retrying addMessages...');
					await this.client.thread.addMessages(this.threadId, { messages });
					this.log('debug', 'Thread created and messages saved');
				} catch (retryError: any) {
					this.log('error', `Retry failed: ${retryError.message}`);
					throw retryError;
				}
			} else {
				throw error;
			}
		}
	}

	async clear() {
		this.log('debug', `Clearing thread: ${this.threadId}`);
		try {
			// SDK Signature: delete(threadId: string)
			this.log('debug', `Calling thread.delete with string: ${this.threadId}`);
			await this.client.thread.delete(this.threadId);
			this.log('debug', 'Thread deleted');
		} catch (error: any) {
			if (error.status !== 404) {
				this.log('error', `thread.delete failed: ${error.message}`);
				throw error;
			}
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
			// Thread ID - Manual input (All versions)
			{
				displayName: 'Thread ID',
				name: 'threadId',
				type: 'string',
				default: '={{ $json.sessionId }}',
				required: true,
				description: 'The ID of the conversation thread. Can be a static value or expression (e.g. {{ $json.sessionId }}).',
			},
			// User ID - Manual input (All versions)
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '={{ $json.userId }}',
				required: true,
				description: 'The ID of the user. Can be a static value or expression. Should be unique per user.',
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

		// Get parameters directly (removed legacy version checks for simplicity)
		const threadId = this.getNodeParameter('threadId', itemIndex, '') as string;
		let userId = this.getNodeParameter('userId', itemIndex, '') as string;

		// Fallback: if userId is empty, use threadId
		if (!userId) userId = threadId;

		log('debug', `Node version: ${nodeVersion}, ThreadID=${threadId}, UserID=${userId}`);

		if (!threadId) {
			throw new NodeOperationError(
				this.getNode(),
				'Thread ID is required. Please provide a valid thread ID.'
			);
		}

		log('info', `Using thread ID: ${threadId}, user ID: ${userId}`);

		try {
			// Initialize Zep Cloud client - using ZepClient constructor
			log('debug', 'Initializing Zep client...');

			const client = new ZepClient({
				apiKey: credentials.apiKey as string,
			});
			log('debug', 'Zep client created');

			// Create memory wrapper with separate userId
			const memory = new ZepMemoryWrapper(client, threadId, userId, this.logger);
			log('info', 'Zep Memory v3 initialized successfully');

			return {
				response: memory,
			};
		} catch (initError: any) {
			log('error', `Failed to initialize Zep client: ${initError.message}`);
			throw new NodeOperationError(
				this.getNode(),
				`Failed to initialize Zep Memory: ${initError.message}`,
				{ description: initError.stack }
			);
		}
	}
}