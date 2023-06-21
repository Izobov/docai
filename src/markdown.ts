import showdown from "showdown";

import * as cheerio from "cheerio";

const converter = new showdown.Converter();

interface IBlockInfo {
	title: string;
	example: string[];
	links: string[];
	content: string;
}

function getMetaInfo(md: string): IBlockInfo {
	// showdown doesn't process syntax like ~~~js
	md = md.replace(/~~~/g, "```\n");
		// Convert to HTML for easier extraction of links, titles, and other information
	const html = converter.makeHtml(md);
	const $ = cheerio.load(html);
	const headings = $("h1, h2, h3");
	const title = $(headings[0]).text()
	const res: IBlockInfo ={
		title,
		example: [],
		links: [],
		content: ""
	}
	const a = $("a");

	a.each((_index, el) => {
		const href = $(el).attr("href");
		if (href) res.links.push(href);
	});

	//Find all code blocks
	const code = $("code");
	code.each((_index, element) => {
		const code = $(element);
		const sample = code.text();
		if (sample) res.example.push(sample);
		code.remove();
	});

	return res;

}

export {  IBlockInfo, getMetaInfo };
