import "dotenv/config";

import { IBlockInfo, analyzeMarkdown } from "./markdown.js";
import { Octokit } from "@octokit/rest";

const { rest: gh_rest } = new Octokit({
	auth: process.env.GH, // GitHub authentication token from environment variables
});

async function scrapeData(url: string) {
	const [_hub, rest] = url.split("https://github.com/");
	const [owner, repo, ...path] = rest.split("/");
	// Find the root directory containing Markdown files
	const mdDir = await findMdDir(owner, repo, path.join("/"));
	if (!mdDir) return;
	let res = {};
	// Analyze files in the directory
	for (const item of mdDir) {
		const d = await analyzeFile(item, { owner, repo });
		res = { ...res, ...d };
	}
	console.log(res);
}

const analyzeFile = async (
	item: { path: any; type: string; name: string | number; data: any },
	params: { repo: string; owner: string },
	res = {} as { [x: string]: IBlockInfo[] }
) => {
	const { owner, repo } = params;
	const { name, type, path } = item;
	const fileContent = (await gh_rest.repos.getContent({
		owner,
		repo,
		path,
	})) as any;
	const fileExtension = `${name}`.split(".").pop();

	// Analyze Markdown files
	if (type === "file" && fileExtension === "md") {
		const decodedContent = atob(fileContent.data.content);
		const data = analyzeMarkdown(decodedContent);
		res[name] = data;
	}
	// Analyze files in a folder
	if (type === "dir" && fileContent.data?.length) {
		for (const subItem of fileContent.data) {
			const data = await analyzeFile(subItem, { owner, repo }, res);
			res = { ...res, ...data };
		}
	}

	return res;
};

// Finds the root directory containing Markdown files
async function findMdDir(owner: string, repo: string, path = ""): Promise<any> {
	try {
		const repoItem = await gh_rest.repos.getContent({
			owner,
			repo,
			path,
		});

		// Sorting data to have files earlier than folders
		const data = (repoItem.data as any).sort((a: any, b: any) => {
			if (a.type === "file" && b.type !== "file") {
				return -1;
			}
			if (a.type !== "file" && b.type === "file") {
				return 1;
			}
			return 0;
		});

		// Checking directory files
		for (const { type, name, path } of data) {
			// If the directory has an index.md file, return the directory files
			if (type === "file" && name.toLowerCase() === "index.md") {
				return data;
			}
			// If it's a folder, recursively check the folder
			if (type === "dir") {
				const data = await findMdDir(owner, repo, path);
				if (data) return data;
			}
		}
	} catch (error) {
		console.log("Something went wrong:", error);
	}
}

// scrapeData("https://github.com/DHTMLX/docs-calendar");
scrapeData("https://github.com/DHTMLX/scheduler-docs");
