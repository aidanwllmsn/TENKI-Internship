import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import styles from "./index.module.css";
export default function Home() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Analyzing');
  const [loadingTextUpdate, setLoadingTextUpdate] = useState('This may take a while.')

  useEffect(() => { // Analyzing dot animation
    if (isLoading) {
      const loadingInterval = setInterval(() => {
        setLoadingText(prev => {
          if (prev === 'Analyzing') return 'Analyzing.';
          if (prev === 'Analyzing.') return 'Analyzing..';
          if (prev === 'Analyzing..') return 'Analyzing...';
          return 'Analyzing';
        });
      }, 250); // Change dots every 250ms

      return () => clearInterval(loadingInterval); // Cleanup interval on unmount
    }
  }, [isLoading]);

  // The optimizaton queries. Change as needed
  const queries = [
    'Consider the last answer as option 1, generate an option 2 in this same exact format (do not add a double newline \n\n after the title of each category) that adds even more broad synonyms/similar terms derived from the product content that were not part of the initial keyword set to broaden the search visibility of the listing', 
    'Generate an option 3 in this same exact format as the previous 2 that uses more concise keywords that aligns with the strategic objective of maximizing search visibility on Rakuten. This includes a final check for completeness, relevance, and adherence to Rakuten’s SEO best practices.',
    'From these 3 options you have just provided me, ignoring any options from previous queries, can you give me a score on each option on how well they would perform on Rakuten based off maximizing search visibility. Can you format as simplistic as possible with minimal explanation like so: Option 1: score Option 2: score Option 3: score. Also, once this query has finished, ignored these previous options for any future queries.'
  ];

  // Counter keeps track of which query is being executed
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
            
            // Detect which query is being ran
            if (counter === 2) {
              setLoadingTextUpdate("Generating score.")
              counter += 1;
              newChatHistory.push({ role: "options", content: firstParagraph });
            } else if (counter === 3) {
              setIsLoading(false);
              newChatHistory.push({ role: "score", content: firstParagraph });
              counter = -1
            } else if (counter === 1) {
              setLoadingTextUpdate('Generating option 3')
              newChatHistory.push({ role: "options", content: firstParagraph });
            } else {
              setLoadingTextUpdate('Generating option 2')
              newChatHistory.push({ role: "options", content: firstParagraph });
            }
            
            return newChatHistory;
          }); 
          if (counter < 2){        
            counter += 1;
            sendMessage(queries[counter]); // Call queries once the stream is done
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

    // Reset the chat history on the server
    await fetch("/api/generate?endpoint=reset", { method: "POST" });
  };

  // Regenerate last submitted message
  const regenerate = async () => {
    if (userMessage.length != 0) {
      setIsLoading(true);
      setLoadingTextUpdate('This may take a while.')
      sendMessage(userMessage);
    } 
  };

  // Events when submit is clicked
  const onSubmit = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    setIsLoading(true);
    setLoadingTextUpdate('This may take a while.')
    setUserMessage(message.trim());
    sendMessage(message.trim());
    setMessage("");
  };

  return (
    <div className={styles.body}>
      <Head>
        <title>TENKI Keyword Optimizer</title>
      </Head>
      <h1 className={styles.heading1}>TENKI-JAPAN Keyword Optimizer</h1>
      {!isLoading && chatHistory.length == 0 && <p className={styles.loadingTextsmall}>Submit a listing. Three optimized options will display here.</p>}
      {isLoading && <p className={styles.loadingText}>{loadingText}</p>}
      {isLoading && <p className={styles.loadingTextsmall}>{loadingTextUpdate}</p>}
      <div className={styles.chatContainer}>
      {!isLoading && chatHistory.map((msg, index) => (
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
              className={styles.inputGen}
              type="button"
              onClick={regenerate}
            >
              Regenerate
            </button>
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