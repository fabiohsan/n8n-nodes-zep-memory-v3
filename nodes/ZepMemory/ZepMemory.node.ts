import {
	ISupplyDataFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';

import { ZepCloudMemory } from '@langchain/community/memory/zep_cloud';
import { ZepMemory as ZepOpenSourceMemory } from '@langchain/community/memory/zep';

class WhiteSpaceTrimmedZepCloudMemory extends ZepCloudMemory {
	async loadMemoryVariables(values: any) {
		const memoryVariables = await super.loadMemoryVariables(values);
		memoryVariables.chat_history = memoryVariables.chat_history.filter(
			(m: any) => m.content.toString().trim()
		);
		return memoryVariables;
	}
}

// MANTIDO: BaseChatMemoryWrapper para compatibilidade máxima
class BaseChatMemoryWrapper {
	private memory: any;

	constructor(memory: any) {
		this.memory = memory;
	}

	async loadMemoryVariables(values: any) {
		return await this.memory.loadMemoryVariables(values);
	}

	async saveContext(inputValues: any, outputValues: any) {
		return await this.memory.saveContext(inputValues, outputValues);
	}

	async clear() {
		return await this.memory.clear();
	}

	get memoryKey() {
		return this.memory.memoryKey;
	}

	get returnMessages() {
		return this.memory.returnMessages;
	}

	get inputKey() {
		return this.memory.inputKey;
	}

	get outputKey() {
		return this.memory.outputKey;
	}
}



export class ZepMemory implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zep Memory v3',
		name: 'zepMemoryV3',
		icon: 'file:zep.png',
		group: ['transform'],
		version: [1, 2, 3, 4],
		description: 'Use Zep Memory v3 for AI agent conversations',
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
						url: 'https://docs.getzep.com',
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
				displayName: 'Works with Zep Cloud v3 and enhanced context retrieval',
				name: 'supportedVersions',
				type: 'notice',
				default: '',
			},
			// Thread ID para versão 1
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
			// Thread ID para versão 1.1
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
			// Thread ID Type para versões 1.2+
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
			// Thread Key From Previous Node (versão 1.3+)
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
		// Helper de logging seguro - funciona mesmo se this.logger não estiver disponível
		const log = (level: 'info' | 'debug' | 'error', message: string, meta?: any) => {
			try {
				if (this.logger && typeof this.logger[level] === 'function') {
					this.logger[level](message, meta);
				}
			} catch (error) {
				// Fallback silencioso para console (aparece nos logs do Docker)
				console.log(`[Zep Memory v3 ${level.toUpperCase()}] ${message}`, meta || '');
			}
		};

		log('info', '🚀 Zep Memory v3 - Starting initialization');

		const credentials = await this.getCredentials('zepApi');
		const nodeVersion = this.getNode().typeVersion;
		log('debug', `Node version: ${nodeVersion}`);

		let threadId: string;

		if (nodeVersion >= 3) {
			const threadIdType = this.getNodeParameter('threadIdType', itemIndex) as string;
			if (threadIdType === 'fromInput') {
				const threadKey = this.getNodeParameter('threadKey', itemIndex, 'threadId') as string;
				const inputData = this.getInputData(itemIndex);
				threadId = String(inputData?.[0]?.json?.[threadKey] || '');
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
			log('error', '❌ Thread ID is missing');
			throw new NodeOperationError(this.getNode(),
				'Thread ID is required. Please provide a valid thread ID.');
		}

		log('info', `✓ Using thread ID: ${threadId}`);

		let baseMemory: any;
		if (credentials.cloud) {
			if (!credentials.apiKey) {
				log('error', '❌ API key is missing for Zep Cloud');
				throw new NodeOperationError(this.getNode(),
					'API key is required for Zep Cloud');
			}
			log('info', '☁️ Initializing Zep Cloud memory');
			baseMemory = new WhiteSpaceTrimmedZepCloudMemory({
				sessionId: threadId,
				apiKey: credentials.apiKey as string,
				memoryType: 'perpetual',
				memoryKey: 'chat_history',
				returnMessages: true,
				inputKey: 'input',
				outputKey: 'output',
				separateMessages: false,
			});
		} else {
			if (!credentials.apiUrl) {
				log('error', '❌ API URL is missing for Zep Open Source');
				throw new NodeOperationError(this.getNode(),
					'API URL is required for Zep Open Source');
			}
			log('info', `🔧 Initializing Zep Open Source memory at ${credentials.apiUrl}`);
			baseMemory = new ZepOpenSourceMemory({
				sessionId: threadId,
				baseURL: credentials.apiUrl as string,
				apiKey: credentials.apiKey as string,
				memoryKey: 'chat_history',
				returnMessages: true,
				inputKey: 'input',
				outputKey: 'output',
			});
		}

		// Wrapper para compatibilidade - SEM logWrapper customizado
		const wrappedMemory = new BaseChatMemoryWrapper(baseMemory);

		log('info', '✅ Zep Memory v3 initialized successfully');

		return {
			response: wrappedMemory,
		};
	}


}