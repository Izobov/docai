import * as denv from "dotenv";
denv.config();

import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY, // OPENAI key from .env
});

export default class ChatGPT {
	public api: OpenAIApi;
	constructor() {
		this.api = new OpenAIApi(configuration);
	}

	async createSystemChat(content: string) {
		const chat = await this.api.createChatCompletion({
			messages: [
				{
					role: "system",
					content:
						"You are Markdown analyzer that returns json objects after analyze",
				},
				{
					role: "system",
					content:
						"Your answer is JSON object. Template: {short_description: string | null, content: string | null, useful_links: string[], examples: string[]}. You can put all html, css and js code in array of examples and then remove it from content string. And you not allowed to add text before result object",
				},

				{
					role: "system",
					content:
						"If you can not analyze markdown string then return 'null' as answer ",
				},
				{ role: "user", content },
			],
			model: "gpt-3.5-turbo",
		});
		return chat.data.choices[0];
	}
}
