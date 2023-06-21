import { PineconeClient } from '@pinecone-database/pinecone';
import * as readline from 'readline';
import "dotenv/config";
import { GithubRepoLoader } from 'langchain/document_loaders/web/github';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getMetaInfo } from './markdown.js';
import { OpenAIEmbeddings } from 'langchain/embeddings';


const pClient = new PineconeClient();
await pClient.init({
	apiKey: process.env.PINECONE_API_KEY as string,
	environment: process.env.PINECONE_ENV as string,
});
const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
    chunkSize: 1000,
});

async function read_doc(url: string, branch="master", name: string) {
    const index = await createIndex(name);
    const loader = new GithubRepoLoader(url, {
        recursive: true,
        branch,
        ignoreFiles: [/^(?!.*\.md$).*$/]
    });
    
    console.log("Fetching github files...");
    const docs = await loader.loadAndSplit(splitter);
    if(!docs.length) {
        console.log("Sorry we haven't found md files...")
        return;
    }
    console.log(
        `Calling OpenAI's Embedding endpoint documents with ${docs.length} text chunks ...`
      );
    const embeddingsArrays = await new OpenAIEmbeddings().embedDocuments(
        docs.map((doc) => doc.pageContent.replace(/\n/g, " "))
        );
    console.log("Prepare documents...");
    const batch = [];
    for (let i = 0; i < docs.length; i++){
        const doc = docs[i]
        const {metadata, pageContent} = doc;

        const source = metadata.source;
        const {title, example, links} = getMetaInfo(pageContent);
        const vector = {
            id: `${name}_${source}_${title}`,
            values:  embeddingsArrays[i],
            metadata: {
                ...metadata,
                loc: JSON.stringify(metadata.loc),
                pageContent: pageContent,
                examples: JSON.stringify(example),
                links: JSON.stringify(links)
            }
        }
        batch.push(vector)
        console.log("Upsert vectors to pinecone index...")
        try {

            await index.upsert({
                upsertRequest: {
                    vectors: [vector]
                }
            });
        } catch(e) {
            console.log(e);
            debugger
        }
    }
    return true



}

async function createIndex(name: string) {
    console.log(`Creating pinecone index with name: ${name}` )
    const check = await pClient.listIndexes();
    let index;
    if (!check.includes(name)) {
        name =  await pClient.createIndex({
            createRequest: {
                name,
                dimension: 1536,
                metric: "cosine"
            }
        });
        await new Promise((resolve) => setTimeout(resolve, 60000));
        index =  await pClient.Index(name);
    } else {
        console.log(`Index already exist. Recreating...` )
        index =  await pClient.Index(name);
        await index.delete1({
            deleteAll: true,
        });
    }
    return index
}



const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
async function simulateChat() {
    rl.question('Type documentation url, branch and doc_name: "url, branch, name" ', async (query) => {
      if (query.toLowerCase() === 'exit') {
          rl.close(); // close
      }
      const [url, branch="master", name=""] = query.split(",");

      console.log("URL: ", url);
      console.log("BRANCH: ", branch);
      console.log("DOC NAME: ", name);
      await read_doc(url, branch, name);
      console.log("Now lets try chat. Type yarn chat to start")

    });
  }
  
//   simulateChat();
read_doc("https://github.com/DHTMLX/scheduler-docs", "master", "scheduler")
