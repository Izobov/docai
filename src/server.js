import * as denv from "dotenv";
import axios from "axios";
import express from "express";
import * as cheerio from "cheerio";
import ChatGPT from "./chatGPT.js";

denv.config();

const app = express();
const port = process.env.PORT || 3000;
const gpt = new ChatGPT();

app.post("/read", async (req, res) => {
	const html = await scrapeData(url);
	console.log(html);
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

async function loadHTML(url) {
	try {
		const response = await axios.get(url);
		return response.data;
	} catch (error) {
		console.error("Error loading the page:", error);
	}
}

async function scrapeData(url) {
	const html = await loadHTML(url);
	const $ = cheerio.load(html);
	const stack = {};
	const aside = $("aside");
	const main = $("main");

	//probably it's our navigation
	const navigationBlock = aside.length ? aside.find("ul") : $("ul:has(a)");

	//probably it's our main articles
	if (main.length) {
		main.find("aside").remove();
	}

	ul.find("svg").remove();
	ul.find("*").removeAttr("class");
	ul.find("*").removeAttr("style");
	const nav = await gpt.getNavigation(ul.html());

	// Вставьте ваш код для извлечения информации из HTML-кода страницы
	// Используйте функции и методы Cheerio для выбора нужных элементов и получения данных
}

scrapeData("https://docs.dhtmlx.com/gantt/api__refs__gantt.html");
// scrapeData("https://docs.dhtmlx.com/eventcalendar/");
// scrapeData("https://react.dev/reference/react");
