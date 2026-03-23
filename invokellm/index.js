import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import readline from "node:readline/promises";

const tvly = new tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const messages = [
    // {
    //   role: "system",
    //   content: `
    //   You are Jarvis, a smart review grader. Your task is to analyze the review and return the sentiment. Classify the review as positive, negative or neutral. 
    //   You must return the result in valid JSON structure.
    //   example: {"sentiment": "positive"}

    //   You have access to the following tools:
    //   - webSearch({query} : {query: string}): Search the web for the most relevant and recent information about the given query`
    // },
    {
      role: "system",
      content: `
      You are Jarvis, a smart assistant. Your task is to answer the user's question. you are helpful and friendly. You are a helpful assistant that can answer questions and help with tasks.

      You have access to the following tools:
      - webSearch: Search the web for the most latest and realtime information about the given query`
    }
  ]

  while (true) {
    const question = await rl.question("You: ")

    if (question.toLowerCase() === "exit") {
      break;
    }

    messages.push({
      role: "user",
      content: question
    })


    while (true) {
      const completion = await groq.chat.completions.create({
        temperature: 0,
        // top_p: 0.1,
        // stop: "ga", // stop sequence use to stop the generation of the response as soon as it encounters the stop sequence - negative
        // max_completion_tokens: 1000,
        // frequency_penalty:  1,
        // presence_penalty: 1,
        // response_format: {
        //   type: "json_schema",
        //   json_schema: {
        //     name: "sentiment",
        //     strict: true,
        //     schema: {
        //       type: "object",
        //       properties: {
        //         sentiment: { type: "string", enum: ["positive", "negative", "neutral"] }
        //       },
        //       required: ["sentiment"],
        //       additionalProperties: false
        //     },
        //   }
        // },
        // model: "openai/gpt-oss-120b",
        model: "llama-3.3-70b-versatile",
        messages: messages,
        tools: [
          {
            type: "function",
            function: {
              name: "webSearch",
              description: "Search the web for the most relevant and recent information about the given query",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The query to search the web for",
                  }
                },
                required: ["query"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: "auto"
      })

      messages.push(completion.choices[0].message);
      const toolCalls = completion.choices[0].message.tool_calls;

      if (!toolCalls) {
        console.log("Jarvis: " + completion.choices[0].message.content);
        break;
      }

      for (const tool of toolCalls) {
        const functionName = tool.function.name;
        const functionArgs = JSON.parse(tool.function.arguments);

        if (functionName === "webSearch") {
          const result = await webSearch(functionArgs);

          messages.push({
            role: "tool",
            content: result,
            tool_call_id: tool.id,
            name: functionName
          })
        }
      }

    }
  }

  rl.close();
}

main();

async function webSearch({ query }) {
  console.log("Calling webSearch...")
  const response = await tvly.search(query);
  const finalResponse = response.results.map(result => result.content).join("\n");
  return finalResponse;
}