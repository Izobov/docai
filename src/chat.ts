import { PineconeClient } from "@pinecone-database/pinecone";
import "dotenv/config";
import { OpenAI } from "langchain";
import { loadQAStuffChain } from "langchain/chains";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { Document } from "langchain/document";
import * as readline from 'readline';
const pClient = new PineconeClient();
await pClient.init({
	apiKey: process.env.PINECONE_API_KEY as string,
	environment: process.env.PINECONE_ENV as string,
});
const llm = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
});
const chain = loadQAStuffChain(llm);



async function queryToVector(indexName: string, question: string) {
    console.log("Querying Pinecone vector store...");
    const index = pClient.Index(indexName);
    const embeddings = new OpenAIEmbeddings()
    const queryEmbedding = await embeddings.embedQuery(question);
    let queryResponse = await index.query({
        queryRequest: {
          topK: 10,
          vector: queryEmbedding,
          includeMetadata: true,
          includeValues: true,
        },
      });
      console.log(`Found ${queryResponse?.matches?.length} matches...`);
      console.log(`Asking question: ${question}...`);
      if (queryResponse?.matches?.length) {
            
      
              const concatenatedPageContent = queryResponse.matches
              .map((match) => (match?.metadata as any)?.pageContent || "")
              .join(" ");
              
            const result = await chain.call({
              input_documents: [new Document({ pageContent: concatenatedPageContent })],
              question: question,
            });
            return result
          } else {
            console.log("Since there are no matches, GPT-3 will not be queried.");
          }
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    async function startChat() {
        rl.question('Type doc name: ', async (query) => {
          if (query.toLowerCase() === 'exit') {
              rl.close(); // Закрытие интерфейса чтения
          }
          const indexName = query.trim();
          simulateChat(indexName)

    
        });
      }

      async function simulateChat(indexName: string) {
        rl.question('Type your question: ', async (query) => {
            if (query.toLowerCase() === 'exit') {
                rl.close(); // exit
            }
            const res = await queryToVector(indexName, query)
            console.log("RES DATA: ", res);
            console.log("TEXT: ", res?.text);
            simulateChat(indexName); // ask another question
          });
      }

      startChat()