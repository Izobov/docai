import showdown from "showdown";

import * as cheerio from "cheerio";

const converter = new showdown.Converter();

interface IBlockInfo {
	title: string;
	example: string[];
	links: string[];
	content: string;
}

function analyzeMarkdown(md: string): IBlockInfo[] {
	// showdown doesn't process syntax like ~~~js
	md = md.replace(/~~~/g, "```\n");

	// Convert to HTML for easier extraction of links, titles, and other information
	const html = converter.makeHtml(md);
	const $ = cheerio.load(html);
	const res: IBlockInfo[] = [];

	// max token counts is 4096
	if (md.length < 3000) {
		// if file is small, analyze whole file
		const title = $("h1");
		res.push(analyzeBlocks($, title[0], false));
	} else {
		// If the markdown is too long, split it by headings
		const headings = $("h1, h2, h3");
		headings.each((index, element) => {
			res.push(analyzeBlocks($, element, true));
		});
	}

	return res;
}

function analyzeBlocks(
	$: cheerio.Root,
	element: cheerio.Element,
	splitDoc: boolean
): IBlockInfo {
	const el = $(element) as cheerio.Cheerio;
	const res = {
		title: "",
		example: [] as string[],
		links: [] as string[],
		content: "",
	};
	if (!el[0]) {
		return res;
	}

	// Generate a summarized title in the format h1_h2_h3
	const tag = (el[0] as cheerio.TagElement).tagName;
	const hLevel = +tag.split("")[1];
	let title = "";
	let i = 0;
	while (i !== hLevel) {
		i++;
		const part = i === hLevel ? el : el.prevAll(`h${i}`).first();
		if (part.length) {
			if (i > 1) title += "_";
			title += part.text();
		}
	}
	res.title = title;

	// Find content for the entire document or the specific block
	const content = splitDoc ? el.nextUntil("h1, h2, h3") : el.nextAll();
	// Find all links
	const a = content.find("a");
	a.each((_index, el) => {
		const href = $(el).attr("href");
		if (href) res.links.push(href);
	});

	//Find all code blocks
	const code = content.find("code");
	code.each((_index, element) => {
		const code = $(element);
		const sample = code.text();
		if (sample) res.example.push(sample);
		code.remove();
	});

	res.content = content.text();
	return res;
}

export { analyzeMarkdown, IBlockInfo };
