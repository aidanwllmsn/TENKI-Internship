import OpenAI from "openai";

/** This file handles the connection and response handling of the ChatGPT API, no need to edit */

const openai = new OpenAI();

let chatHistory = [];

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case "POST":
      if (req.query.endpoint === "chat") {
        // Handle POST to /api/generate?endpoint=chat
        const content = req.body.message;
        if (chatHistory.length > 5) {
          chatHistory = [];
        }
        chatHistory.push({ role: "user", content: content });
        res.status(200).json({ success: true });
      } else if (req.query.endpoint === "reset") {
        // Handle POST to /api/generate?endpoint=reset
        chatHistory = [];
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ error: "Not Found" });
      }
      break;
    case "GET":
      if (req.query.endpoint === "history") {
        res.status(200).json(chatHistory);
      } else if (req.query.endpoint === "stream") {
        // Set headers for Server-Sent Events
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        try {
          let accumulatedData = "";

          // Specifications of API model and settings, change as needed
          const stream = await openai.beta.chat.completions.stream({
            model: "gpt-4o-mini",
            messages: chatHistory,
            stream: true,
            temperature: 0.0,
          });

          if (chatHistory.length == 1) {
            chatHistory = [];
          }

          for await (const chunk of stream) {
            const message = chunk.choices[0]?.delta?.content || "";
            accumulatedData = accumulatedData + message;
            res.write(`data: ${JSON.stringify(message)}\n\n`);
          }

          chatHistory.push({ role: "assistant", content: accumulatedData });
          res.write('data: {"end_of_stream": true}\n\n');
        } catch (error) {
          res.write(
            "event: error\ndata: " +
              JSON.stringify({ message: "Stream encountered an error" }) +
              "\n\n"
          );
        }

        // When the client closes the connection, we stop the stream
        return new Promise((resolve) => {
          req.on("close", () => {
            resolve();
          });
        });
      } else {
        res.status(404).json({ error: "Not Found" });
      }
      break;
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
