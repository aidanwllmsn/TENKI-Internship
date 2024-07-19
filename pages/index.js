import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { usePageContext } from '../context/PageContext';
import { useWaitForLoading } from './useWaitForLoading';
import styles from "./index.module.css";
export default function Home() {
  const [message, setMessage] = useState("");
  const { pageState, setPageState, isProcessed, setIsProcessed, isLoading, setIsLoading } = usePageContext();
  const [allChat, setAllChat] = useState(pageState || []);
  const [items, setItems] = useState([]);
  const [userMessage, setUserMessage] = useState([]);
  const [loadingText, setLoadingText] = useState('Analyzing');
  const [loadingTextUpdate, setLoadingTextUpdate] = useState('Generating option 1')
  const [showMessage, setShowMessage] = useState(false);

  const router = useRouter(); // Get router object

  const [strings, setStrings] = useState([]);
  const waitForLoading = useWaitForLoading(isLoading);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/strings');
      const data = await response.json();
      setStrings(data);
    };
    fetchData();
  }, []);

  useEffect(() => { // Sucessfully saved message
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
    'Generate a second response that adds even more broad synonyms/similar terms derived from the product content that were not part of the initial keyword set to broaden the search visibility of the listing. Format it like so: "関連キーワード: {新しい関連キーワード}\n\n"', 
    'Generate a third response that uses more concise keywords that aligns with the strategic objective of maximizing search visibility on Rakuten. This includes a final check for completeness, relevance, and adherence to Rakuten’s SEO best practices. Format it like so: "関連キーワード: {新しい関連キーワード}\n\n"',
    "Can you provide a score for each of these three responses out of 10 based on how well they would perform on Rakuten based off maximizing search visibility. Format it like so: Option 1: score, Option 2: score, Option 3: score",
  ]
  // Counter keeps track of which query is being executed
  let counter = 0;

  // Send query message to GPT
  const sendMessage = async (message) => { 
    // Append user message to chat history
    setAllChat((prev) => [...prev]);

    if (counter == 0) {
      message = 'Provide the answer in this exact format "関連キーワード: {新しい関連キーワード}\n\n" ' + message;
    }

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
          setAllChat((prevAllChat) => {
            const newAllChat = [...prevAllChat];
            
            // Detect which query is being ran and perform actions
            if (counter === 2) {
              setLoadingTextUpdate('Generating option 3')
              newAllChat.push({ role: "options", content: firstParagraph });
            } else if (counter === 3) {
              setLoadingTextUpdate("Generating score.")
              counter += 1;

              newAllChat.push({ role: "options", content: firstParagraph });
            } else if (counter === 4) {
              newAllChat.push({ role: "score", content: firstParagraph }); 
              counter = 0;
              setIsLoading(false);
            } else {
              setLoadingTextUpdate('Generating option 2')
              newAllChat.push({ role: "options", content: firstParagraph });
            }
            return newAllChat;
          }); 

          // Call queries, then clear chat history
          if (counter < 3){      
            counter += 1;
            sendMessage(queries[counter - 1]); // Call queries once the stream is done
          } 
        } else {
         accumulatedData += parsedData;
       }
      };
      eventSource.onopen = () => console.log("Connection to stream opened");
      eventSource.onerror = function () {
        eventSource.close();
      };
    }
   };

  // Go to the saved keywords page
  const showTable = async () => {
    if (isLoading) return;
    setPageState(allChat);
    router.push('/items');
  };

  // Find the option blocks for filtering
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

  // Add selected keywords to the databse
  const addItem = async (content, index) => {
    if (allChat[index].role === 'score' || isLoading) return;
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

  // Function to process strings sequentially
  const processStringsSequentially = async (strings) => {
    for (const str of strings) {
      setIsLoading(true);
      await sendMessage(str.trim());
      // Wait for isLoading to become false before continuing
      await waitForLoading();
    }
    setIsProcessed(true);
    console.log(isProcessed);
  };

  useEffect(() => {
    console.log(isProcessed);
    if (!isProcessed && strings.length > 0) {
      processStringsSequentially(strings);
    }
  }, [isProcessed, strings]);

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
      {/* <div className={styles.messageInputContainer}>
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
      </div> */}
      <div className={`${styles.successMessage} ${showMessage ? styles.show : styles.hide}`}>
        Successfully Saved
      </div>
    </div>
  );
}