import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import styles from "./index.module.css";
export default function Home() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const chatContainerRef = useRef(null);

  // The optimizaton queries
  const queries = [
    'Consider the last answer as option 1, generate an option 2 in this same exact format (do not add a double newline \n\n after the title of each category) that adds even more broad synonyms/similar terms derived from the product content that were not part of the initial keyword set to broaden the search visibility of the listing', 
    'Generate an option 3 in this same exact format as the previous 2 that uses more concise keywords that aligns with the strategic objective of maximizing search visibility on Rakuten. This includes a final check for completeness, relevance, and adherence to Rakuten’s SEO best practices.',
    'From the 3 options you have just provided me, can you give me a score on each option on how well they would perform on Rakuten based off maximizing search visibility. Can you format as simplistic as possible with minimal explanation like so: Option 1: score Option 2: score Option 3: score'
  ];
  let counter = -1;

  const sendMessage = async (message) => { 

    // Append user message to chat history
    setChatHistory((prev) => [...prev],);

    // Send the user's message to the server
    const response = await fetch("/api/generate?endpoint=chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    if (data.success) {
      // Open a connection to receive streamed responses
      const eventSource = new EventSource("/api/generate?endpoint=stream");
      let accumulatedData = '';

      eventSource.onmessage = function (event) {
        // Parse the event data, which is a JSON string
        const parsedData = JSON.parse(event.data);

        if (parsedData.end_of_stream) {
          eventSource.close();
          const firstParagraph = accumulatedData.split('\n\n')[0];
          setChatHistory((prevChatHistory) => {
            const newChatHistory = [...prevChatHistory];
            // console.log(counter); for testing
            if (counter === 2) {
              counter += 1;
              newChatHistory.push({ role: "options", content: firstParagraph });
            } else if (counter === 3) {
              newChatHistory.push({ role: "score", content: firstParagraph });
            } else {
              newChatHistory.push({ role: "options", content: firstParagraph });
            }
            
            return newChatHistory;
          }); 
          if (counter < 2){        
            counter += 1;
            sendMessage(queries[counter]); // Call optimization once the stream is done
          }
        }
        else{
         accumulatedData += parsedData;
       }
      };
      eventSource.onopen = () => console.log("Connection to stream opened");
      eventSource.onerror = function () {
        eventSource.close();
      };
    }
   };

  const clearChat = async () => {
    // Clear the chat history in the client state
    setChatHistory([]);
    counter = -1

    // Reset the chat history on the server
    await fetch("/api/generate?endpoint=reset", { method: "POST" });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    counter = -1
    sendMessage(message.trim());
    setMessage("");
  };

  return (
    <div className={styles.body}>
      <Head>
        <title>TENKI Keyword Optimizer</title>
      </Head>
      <h1 className={styles.heading1}>TENKI-JAPAN Keyword Optimizer</h1>
      <div className={styles.chatContainer}>
      {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={
              msg.role === "score" ? styles.chatBox2 : styles.chatBox
            }
          >
            {msg.content}
          </div>
      ))}
    </div>
      <div className={styles.messageInputContainer}>
        <form onSubmit={onSubmit}>
          <textarea
            className={styles.textarea}
            name="message"
            placeholder="Paste the listing here..."
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
          <div className={styles.buttonGroup}>
            <input className={styles.inputSubmit} type="submit" value="Optimize" />
            <button
              className={styles.inputButton}
              type="button"
              onClick={clearChat}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}