export type TranslateResult = {
	translated: string;
	terms: any[];
	flags: string[];
};

export interface LLMAdapter {
	translate(
		fromLang: string,
		toLang: string,
		text: string
	): Promise<TranslateResult>;
}
