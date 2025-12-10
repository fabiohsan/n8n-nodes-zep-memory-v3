import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Zep Cloud API Credentials
 * v0.3.0 - Cloud-only (Open Source support removed)
 */
export class ZepApi implements ICredentialType {
	name = 'zepApi';

	displayName = 'Zep Cloud API';

	documentationUrl = 'https://help.getzep.com';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Zep Cloud API Key. Get it from https://app.getzep.com',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Api-Key {{ $credentials.apiKey }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.getzep.com',
			url: '/api/v2/threads',
			method: 'GET',
		},
	};
}