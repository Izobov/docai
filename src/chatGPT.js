import * as denv from "dotenv";
import { ChatGPTAPI } from "chatgpt";
denv.config();

export default class ChatGPT {
	constructor() {
		this.api = new ChatGPTAPI({
			apiKey: process.env.OPENAI_API_KEY,
			maxModelTokens: 10000,
		});
	}

	async getNavigation(html) {
		const q = `Analyze html and give back only html block which looks like documentation navigation and stay only things that lids to api explanation : "${html}"`;
		console.log(html);
		const nav = await this.api.sendMessage(q);
		console.log(nav);
		return nav;
	}
}
