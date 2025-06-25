import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeParameterValueType,
} from 'n8n-workflow';

import { OptionsWithUri } from 'request';
import * as cheerio from 'cheerio';

export class FreeSearch implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Free Search',
		name: 'freeSearch',
		icon: 'fa:search',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["query"]}}',
		description: 'Выполняет поиск в интернете без использования API ключей',
		defaults: {
			name: 'Free Search',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Web Search',
						value: 'webSearch',
						description: 'Поиск в интернете',
						action: 'Perform web search',
					},
					{
						name: 'News Search',
						value: 'newsSearch',
						description: 'Поиск новостей',
						action: 'Search for news',
					},
					{
						name: 'Image Search',
						value: 'imageSearch',
						description: 'Поиск изображений',
						action: 'Search for images',
					},
				],
				default: 'webSearch',
			},
			{
				displayName: 'Search Query',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'Введите поисковый запрос',
				description: 'Текст для поиска',
				required: true,
			},
			{
				displayName: 'Search Engine',
				name: 'searchEngine',
				type: 'options',
				options: [
					{
						name: 'DuckDuckGo',
						value: 'duckduckgo',
						description: 'Использовать DuckDuckGo (рекомендуется)',
					},
					{
						name: 'Bing',
						value: 'bing',
						description: 'Использовать Bing',
					},
					{
						name: 'Yahoo',
						value: 'yahoo',
						description: 'Использовать Yahoo',
					},
				],
				default: 'duckduckgo',
				description: 'Выберите поисковую систему',
			},
			{
				displayName: 'Max Results',
				name: 'maxResults',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 20,
				},
				default: 10,
				description: 'Максимальное количество результатов для возврата',
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'options',
				options: [
					{
						name: 'Any Language',
						value: 'any',
					},
					{
						name: 'English',
						value: 'en',
					},
					{
						name: 'Russian',
						value: 'ru',
					},
					{
						name: 'Spanish',
						value: 'es',
					},
					{
						name: 'French',
						value: 'fr',
					},
					{
						name: 'German',
						value: 'de',
					},
				],
				default: 'any',
				description: 'Язык результатов поиска',
			},
			{
				displayName: 'Safe Search',
				name: 'safeSearch',
				type: 'options',
				options: [
					{
						name: 'Strict',
						value: 'strict',
					},
					{
						name: 'Moderate',
						value: 'moderate',
					},
					{
						name: 'Off',
						value: 'off',
					},
				],
				default: 'moderate',
				description: 'Уровень фильтрации контента',
			},
			{
				displayName: 'Include Snippets',
				name: 'includeSnippets',
				type: 'boolean',
				default: true,
				description: 'Включать ли краткие описания в результаты',
			},
			{
				displayName: 'Time Range',
				name: 'timeRange',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['webSearch', 'newsSearch'],
					},
				},
				options: [
					{
						name: 'Any Time',
						value: 'any',
					},
					{
						name: 'Past Hour',
						value: 'h',
					},
					{
						name: 'Past Day',
						value: 'd',
					},
					{
						name: 'Past Week',
						value: 'w',
					},
					{
						name: 'Past Month',
						value: 'm',
					},
					{
						name: 'Past Year',
						value: 'y',
					},
				],
				default: 'any',
				description: 'Временной диапазон для поиска',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const query = this.getNodeParameter('query', i) as string;
				const searchEngine = this.getNodeParameter('searchEngine', i) as string;
				const maxResults = this.getNodeParameter('maxResults', i) as number;
				const language = this.getNodeParameter('language', i) as string;
				const safeSearch = this.getNodeParameter('safeSearch', i) as string;
				const includeSnippets = this.getNodeParameter('includeSnippets', i) as boolean;
				const timeRange = this.getNodeParameter('timeRange', i, 'any') as string;

				let results: any[] = [];

				// Выполняем поиск в зависимости от выбранной поисковой системы
				switch (searchEngine) {
					case 'duckduckgo':
						results = await this.searchDuckDuckGo(
							query,
							operation,
							maxResults,
							language,
							safeSearch,
							timeRange,
							includeSnippets,
						);
						break;
					case 'bing':
						results = await this.searchBing(
							query,
							operation,
							maxResults,
							language,
							safeSearch,
							timeRange,
							includeSnippets,
						);
						break;
					case 'yahoo':
						results = await this.searchYahoo(
							query,
							operation,
							maxResults,
							language,
							safeSearch,
							timeRange,
							includeSnippets,
						);
						break;
					default:
						throw new Error(`Неподдерживаемая поисковая система: ${searchEngine}`);
				}

				// Добавляем метаданные к результатам
				const responseData = {
					query,
					searchEngine,
					operation,
					totalResults: results.length,
					timestamp: new Date().toISOString(),
					results,
				};

				returnData.push({
					json: responseData,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							query: this.getNodeParameter('query', i),
							searchEngine: this.getNodeParameter('searchEngine', i),
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}

	// Поиск через DuckDuckGo
	private async searchDuckDuckGo(
		query: string,
		operation: string,
		maxResults: number,
		language: string,
		safeSearch: string,
		timeRange: string,
		includeSnippets: boolean,
	): Promise<any[]> {
		const results: any[] = [];

		try {
			// Формируем URL для DuckDuckGo
			let searchUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
			
			// Добавляем параметры языка
			if (language !== 'any') {
				searchUrl += `&kl=${language}-${language}`;
			}
			
			// Добавляем параметры безопасного поиска
			const safeSearchMap = { strict: '1', moderate: '0', off: '-1' };
			searchUrl += `&safe_search=${safeSearchMap[safeSearch] || '0'}`;

			// Настройки для HTTP запроса
			const options: OptionsWithUri = {
				method: 'GET',
				uri: searchUrl,
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.5',
					'Accept-Encoding': 'gzip, deflate',
					'Connection': 'keep-alive',
				},
				gzip: true,
				timeout: 10000,
			};

			const response = await this.helpers.request!(options);
			const $ = cheerio.load(response);

			// Парсим результаты поиска
			$('.result').each((index, element) => {
				if (results.length >= maxResults) return false;

				const $element = $(element);
				const title = $element.find('.result__title a').text().trim();
				const link = $element.find('.result__title a').attr('href');
				const snippet = includeSnippets ? $element.find('.result__snippet').text().trim() : '';

				if (title && link) {
					// Очищаем ссылку от DuckDuckGo редиректа
					const cleanLink = this.cleanDuckDuckGoLink(link);
					
					results.push({
						title,
						link: cleanLink,
						snippet,
						position: results.length + 1,
						source: 'duckduckgo',
					});
				}
			});

			return results;
		} catch (error) {
			throw new Error(`Ошибка поиска DuckDuckGo: ${error.message}`);
		}
	}

	// Поиск через Bing
	private async searchBing(
		query: string,
		operation: string,
		maxResults: number,
		language: string,
		safeSearch: string,
		timeRange: string,
		includeSnippets: boolean,
	): Promise<any[]> {
		const results: any[] = [];

		try {
			let searchUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(query);
			
			// Добавляем параметры языка
			if (language !== 'any') {
				searchUrl += `&setlang=${language}`;
			}

			const options: OptionsWithUri = {
				method: 'GET',
				uri: searchUrl,
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				},
				gzip: true,
				timeout: 10000,
			};

			const response = await this.helpers.request!(options);
			const $ = cheerio.load(response);

			// Парсим результаты Bing
			$('.b_algo').each((index, element) => {
				if (results.length >= maxResults) return false;

				const $element = $(element);
				const title = $element.find('h2 a').text().trim();
				const link = $element.find('h2 a').attr('href');
				const snippet = includeSnippets ? $element.find('.b_caption p').text().trim() : '';

				if (title && link) {
					results.push({
						title,
						link,
						snippet,
						position: results.length + 1,
						source: 'bing',
					});
				}
			});

			return results;
		} catch (error) {
			throw new Error(`Ошибка поиска Bing: ${error.message}`);
		}
	}

	// Поиск через Yahoo
	private async searchYahoo(
		query: string,
		operation: string,
		maxResults: number,
		language: string,
		safeSearch: string,
		timeRange: string,
		includeSnippets: boolean,
	): Promise<any[]> {
		const results: any[] = [];

		try {
			const searchUrl = 'https://search.yahoo.com/search?p=' + encodeURIComponent(query);

			const options: OptionsWithUri = {
				method: 'GET',
				uri: searchUrl,
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				},
				gzip: true,
				timeout: 10000,
			};

			const response = await this.helpers.request!(options);
			const $ = cheerio.load(response);

			// Парсим результаты Yahoo
			$('.Sr').each((index, element) => {
				if (results.length >= maxResults) return false;

				const $element = $(element);
				const title = $element.find('h3 a').text().trim();
				const link = $element.find('h3 a').attr('href');
				const snippet = includeSnippets ? $element.find('.compText').text().trim() : '';

				if (title && link) {
					results.push({
						title,
						link,
						snippet,
						position: results.length + 1,
						source: 'yahoo',
					});
				}
			});

			return results;
		} catch (error) {
			throw new Error(`Ошибка поиска Yahoo: ${error.message}`);
		}
	}

	// Очистка ссылок DuckDuckGo от редиректов
	private cleanDuckDuckGoLink(link: string): string {
		if (link.startsWith('/l/?uddg=')) {
			// Декодируем URL из DuckDuckGo редиректа
			const url = new URL('https://html.duckduckgo.com' + link);
			const uddg = url.searchParams.get('uddg');
			if (uddg) {
				try {
					return decodeURIComponent(uddg);
				} catch (e) {
					return link;
				}
			}
		}
		return link;
	}
}