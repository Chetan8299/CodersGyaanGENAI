import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const completion = await groq.chat.completions.create({
    temperature: 1,
    // top_p: 0.1,
    // stop: "ga", // stop sequence use to stop the generation of the response as soon as it encounters the stop sequence - negative
    // max_completion_tokens: 1000,
    // frequency_penalty:  1,
    // presence_penalty: 1,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "sentiment",
        strict: true,
        schema: {
          type: "object",
          properties: {
            sentiment: { type: "string", enum: ["positive", "negative", "neutral"] }
          },
          required: ["sentiment"],
          additionalProperties: false
        },
      }
    },
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content: `
        You are Jarvis, a smart review grader. Your task is to analyze the review and return the sentiment. Classify the review as positive, negative or neutral. 
        You must return the result in valid JSON structure.
        example: {"sentiment": "positive"}
        
        You have access to the following tools:
        - webSearch({query} : {query: string}): Search the web for the most relevant and recent information about the given query`
      },
      {
        role: "user",
        content: `Review: These headphones arrived quickly and look great, but the left earcup stopped working after a few days
          Sentiment: `
      }
    ],
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

  console.log(JSON.parse(completion.choices[0].message.content));
}

main();

function webSearch({query}) { 
  return "Iphone 16 was launched on September 12, 2025"
}