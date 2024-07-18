import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/router';
import { usePageContext } from '../context/PageContext';
import styles from "./index.module.css";
export default function Home() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const { setPageState, pageState } = usePageContext();
  const [allChat, setAllChat] = useState(pageState || []);
  const [items, setItems] = useState([]);
  const [userMessage, setUserMessage] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Analyzing');
  const [loadingTextUpdate, setLoadingTextUpdate] = useState('This may take a while.')
  const [showMessage, setShowMessage] = useState(false);

  const router = useRouter(); // Get router object

  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showMessage]);

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
    'Generate a second response in this same exact format that adds even more broad synonyms/similar terms derived from the product content that were not part of the initial keyword set to broaden the search visibility of the listing', 
    'Condense and refine these into more concise keywords.',
    "Can you provide a score of each of these three responses out of 10 based on how well you think they would perform on Rakuten based off maximizing search visibility. Can you format as simplistic as possible with minimal explanation like so: Option 1: score Option 2: score Option 3: score",
    "Now I will give you a new query of the similar format. Disregard the previous queries and give me a new optimization of this next listing."
  ];

  // Counter keeps track of which query is being executed
  let counter = 0;

  const sendMessage = async (message) => { 

    // Append user message to chat history
    setChatHistory((prev) => [...prev]);

    if (counter == 0) {
      message = 'Provide the answer in this format"関連キーワード: {new key words}\n\n"' + message;
    }

    console.log(message);

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

        // Detect end of stream
        if (parsedData.end_of_stream) {
          eventSource.close();
          const firstParagraph = accumulatedData.split('\n\n')[0];
          setChatHistory((prevChatHistory) => {
            const newChatHistory = [...prevChatHistory];
            
            // Detect which query is being ran and perform actions
            if (counter === 2) {
              setLoadingTextUpdate('Generating option 3')
              newChatHistory.push({ role: "options", content: firstParagraph });
            } else if (counter === 3) {
              setLoadingTextUpdate("Generating score.")

              newChatHistory.push({ role: "options", content: firstParagraph });
            } else if (counter === 4) {
              newChatHistory.push({ role: "score", content: firstParagraph });
              counter += 1;
            } else if (counter === 5) {
              setIsLoading(false);
              setAllChat((prevAllChat) => [
                ...prevAllChat,
                ...newChatHistory,
              ]);
              counter = 0
              return;
            } else {
              setLoadingTextUpdate('Generating option 2')
              newChatHistory.push({ role: "options", content: firstParagraph });
            }
            return newChatHistory;
          }); 

          // Call queries, then clear chat history
          if (counter < 4){        
            counter += 1;
            sendMessage(queries[counter - 1]); // Call queries once the stream is done
          } else if (counter > 4) {
            setChatHistory([]);
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
    setAllChat([]);
    setUserMessage([]);

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

  const showTable = async () => {
    setPageState(allChat);
    router.push('/items');
  };

  const findBlockIndices = (index) => {
    const role = allChat[index].role;
    let start = index;
    let end = index;
    // Find the start of the block
    while (start > 0 && allChat[start - 1].role === role) {
      start--;
    }
    // Find the end of the block
    while (end < allChat.length - 1 && allChat[end + 1].role === role) {
      end++;
    }
      // Include the following score message if present
    if (end < allChat.length - 1 && allChat[end + 1].role === 'score') {
      end++;
    }
    return { start, end };
    };

  const addItem = async (content, index) => {
    if (allChat[index].role === 'score') {
      return;
    }
    try {
      const response = await fetch('/api/addItem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: content }),
      });
      const result = await response.json();
      if (result.success) {
        setItems([...items, result.data]);
        const { start, end } = findBlockIndices(index);
        const newChat = allChat.filter((_, idx) => idx < start || idx > end);
        setAllChat(newChat);
        setShowMessage(true);
      } else {
        alert('Failed to add item.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add item.');
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
      <div className="header">
        <h1 className={styles.heading1}>TENKI-JAPAN Keyword Optimizer</h1>
        {!isLoading && allChat.length == 0 && <p className={styles.loadingTextsmall}>Submit a listing. Three optimized options will display here.</p>}
        <button
          className={styles.dataButton}
          type="button"
          onClick={showTable}
        >
          Saved Keywords
        </button>
      </div>
      <div className={styles.chatContainer}>
      {allChat.map((msg, index) => (
          <button onClick={() => addItem(msg.content, index)} key={index}
            className={msg.role === "score" ? styles.chatBox2 : styles.chatBox}>
            {msg.content}
          </button>
      ))}
        {isLoading && <p className={styles.loadingText}>{loadingText}</p>}
        {isLoading && <p className={styles.loadingTextsmall}>{loadingTextUpdate}</p>}
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
      <div className={`${styles.successMessage} ${showMessage ? styles.show : styles.hide}`}>
        Successfully Saved
      </div>
    </div>
  );
}