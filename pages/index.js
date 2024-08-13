import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { usePageContext } from "../context/PageContext";
import { useWaitForLoading } from "../hooks/useWaitForLoading";
import styles from "./index.module.css";
import Papa from "papaparse";
import RawHtmlComponent from "./api/iframe";

export default function Home() {
  const {
    pageState,
    setPageState,
    isProcessed,
    setIsProcessed,
    isLoading,
    setIsLoading,
    listing,
    setListing,
  } = usePageContext();
  const [allChat, setAllChat] = useState(pageState || []);
  const [items, setItems] = useState([]);
  const [loadingText, setLoadingText] = useState("Analyzing");
  const [loadingTextUpdate, setLoadingTextUpdate] = useState(
    "Generating option 1"
  );
  const [showMessage, setShowMessage] = useState(false);
  const [showMessage2, setShowMessage2] = useState(false);
  const [strings, setStrings] = useState([]);
  const waitForLoading = useWaitForLoading(isLoading);
  const [allRows, setAllRows] = useState([]);
  const [currentRows, setCurrentRows] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [url, setUrl] = useState([]);
  const [expanded, setExpanded] = useState(allChat.map(() => false));

  // Read from file in chunks
  useEffect(() => {
    if (!isProcessed && allRows.length === 0) {
      fetch("/data/glv-sample2.csv") // File to read from
        .then((response) => response.text())
        .then((csvData) => {
          Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            chunk: function (results) {
              setAllRows((prevRows) => [...prevRows, ...results.data]);
              if (results.errors.length) {
                console.error("Error parsing CSV:", results.errors);
              }
            },
            complete: function () {
              // console.log('Fetched Rows:', allRows); // Debug: Log the fetched rows data
            },
          });
        })
        .catch((error) => {
          console.error("Error reading CSV:", error);
        });
    }
  }, [isProcessed, allRows]);

  // Load first chunk at launch
  useEffect(() => {
    if (allRows.length > 0 && currentRows.length === 0) {
      loadNextChunk(allRows, 0); // Load the first chunk initially
    }
  }, [allRows]);

  // Parses data rows and converts them to initial query
  useEffect(() => {
    if (currentRows.length > 0) {
      const formattedStrings = currentRows.map((row) => {
        const concatenatedString = `Instructions for Optimizing Keywords for Rakuten Listings:

Objective: Enhance search visibility and relevance of Rakuten listings through strategic keyword optimization, aligning with customer search behaviors and Rakuten's platform standards. The goal is to meticulously analyze and optimize the listing to attract a broader audience by leveraging a comprehensive set of keywords.


1. Comprehensive Review of Listing Elements:
Initial Analysis: Start by examining the list of initial keywords, the product title, catch copy, and the product description. This review is essential for understanding the product’s key features and unique selling propositions.

2. Strategic Generation of "関連キーワード" (Related Keywords):
- Expansion with Synonyms and Related Terms: Use the initial keywords as a base and methodically expand this list by incorporating synonyms and related terms. Focus on including terms that highlight product specifications (size, material, color, age suitability) and any unique features or benefits not directly mentioned in the initial list.
- Explicit Synonym Inclusion: It is important to add synonyms for key attributes and related terms that potential customers might use in their search queries. This step is vital for capturing a wide range of customer intents.

3. Detailed Keyword Categorization for Precision:
- Ignored Keywords Because Not in Content: Identify and list any provided keywords not directly referenced or implied in the product description, marking "N/A" if none apply.
- Used from List Although Not Directly in Content: Document the keywords from the initial list that have been included in the 関連キーワード (related keywords) section despite not appearing in the product's title, catch copy, or description. Indicate "N/A" if not applicable.
- Inclusion of Synonyms/Similar Terms: Actively seek and list additional synonyms or closely related terms derived from the product content that were not part of the initial keyword set. This step is crucial for broadening the search visibility of the listing.

4. Ensure Coherence, Relevance, and Platform Compliance:
Ensure all keywords and categorized lists are presented clearly and cohesively, adhering to Rakuten's preferred formatting. All terms must be directly relevant and accurately reflect the product to enhance searchability and meet Rakuten’s SEO standards.

5. Formatting:
- Result should include 4 sections:
関連キーワード: (bold)
followed by list (keywords separated by space)

- Ignored Keywords Because Not in Content
- Used from List Although Not Directly in Content
- Inclusion of Synonyms/Similar Terms
each one of 3 above is followed by list of keywords, one per line (or N/A).

- No Explanatory Text: Exclude any form of explanatory text before, within, or after the listing of requested results. The response should be limited strictly to the output or data requested.
- Adhere to Requested Structure: Follow the structure requested for the response meticulously. If the request specifies a list, provide only the list in the format and order requested without deviation.
- Clear and Concise: Keep all listings clear, concise, and directly relevant to the instructions given. Unnecessary elaboration or deviation from the requested format is to be avoided.

6. Final Review for Comprehensive Coverage and Strategic Alignment:
- Conduct a thorough review to ensure the keyword list is exhaustive and aligns with the strategic objective of maximizing search visibility on Rakuten. This includes a final check for completeness, relevance, and adherence to Rakuten’s SEO best practices.
- Ensure that keywords incorporated into the 関連キーワード section are accurately identified as either directly mentioned in the listing content (title, catch copy, product description) or included based on their relevance to the product, without direct mention within the main text. to summarize, process should be:
Initial Keyword Review: "Start by reviewing the provided keywords. Determine their direct relevance to the product by checking if they or their close derivatives appear in the product title, catch copy, or description."

Generating Related Keywords: "Expand the initial keyword list by adding synonyms and related terms. Include only those terms that are directly associated with the product’s features, benefits, or use cases. Avoid adding general terms that are not specific to the product."

Categorization of Keywords:"List any keywords from the provided list that are not found in the product's title, catch copy, or description under 'Ignored Keywords Because Not in Content.'"
"For 'Used from List Although Not Directly in Content,' include keywords that, while not explicitly mentioned, are closely related to the product's features or benefits and have been included in the related keywords section."
"Under 'Inclusion of Synonyms/Similar Terms,' list additional relevant terms derived from the listing content that expand the search visibility but were not included in the initial set."

Final Check for Alignment and Relevance: EXTREMELY IMPORTANT "Review the keyword lists to ensure they are exhaustive, relevant, and aligned with strategic objectives for maximizing search visibility. Adjust as necessary for coherence and compliance with Rakuten’s standards."

Provide the answer in this exact format "関連キーワード: {新しい関連キーワード}. End of Instructions Item: https://item.rakuten.co.jp/${row["shop_id_url"]}/${row["item_id_url"]}/, ID: ${row["item_id_url"]}, Keywords: ${Object.values(row)
          .slice(9)
          .join(" ")}, title: ${row["ftp_title"]}, content: ${row["ftp_desc_pc"]}`;
        setListing((prevListing) => [...prevListing, `${row["ftp_desc_pc"]}`]);
        const currentUrl = `https://item.rakuten.co.jp/${row["shop_id_url"]}/${row["item_id_url"]}/`; // Create url and enqueue
        setUrl((prevUrl) => [...prevUrl, currentUrl]);
        return concatenatedString;
      });
      setStrings(formattedStrings);
      processData(formattedStrings); // Send queries so be processed
    }
  }, [currentRows]);

  // Load the next chunk
  const loadNextChunk = (data, startIndex) => {
    let chunkSize = 3;
    const nextChunk = data.slice(startIndex, startIndex + chunkSize);
    setCurrentRows(nextChunk);
    setCurrentIndex(startIndex + nextChunk.length);
  };

  // Detect when to load the next chunk (no more listings showing)
  useEffect(() => {
    if (allChat.length === 0 && isProcessed) {
      setIsLoading(true);
      setIsProcessed(false);
      loadNextChunk(allRows, currentIndex);
    }
  }, [allChat, isProcessed]);

  // Function to process data sequentially
  const processData = async (strings) => {
    // Iterate chunk of initial queries
    for (const str of strings) {
      setLoadingTextUpdate("Generating option 1");
      setIsLoading(true);
      await sendMessage(str.trim());
      // Wait for all subqueries to finish before send next initial query
      await waitForLoading(); // Wait for isLoading to become false
    }
    setIsProcessed(true);
  };

  const router = useRouter(); // Get router object

  // Sucessfully saved message animation
  useEffect(() => {
    if (showMessage || showMessage2) {
      const timer = setTimeout(() => {
        setShowMessage(false);
        setShowMessage2(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showMessage, showMessage2]);

  // Analyzing dot animation
  useEffect(() => {
    if (isLoading) {
      const loadingInterval = setInterval(() => {
        setLoadingText((prev) => {
          if (prev === "Analyzing") return "Analyzing.";
          if (prev === "Analyzing.") return "Analyzing..";
          if (prev === "Analyzing..") return "Analyzing...";
          return "Analyzing";
        });
      }, 250); // Change dots every 250ms

      return () => clearInterval(loadingInterval); // Cleanup interval on unmount
    }
  }, [isLoading]);

  // Highlight words in each box red/yellow
  const highlightWords = (message, red, yellow) => {
    let highlightedMessage = message;

    // Replace each detected word with new HTML
    red.forEach((word) => {
      const regex = new RegExp(`(${word})`, "gi");
      highlightedMessage = highlightedMessage.replace(
        regex,
        `<span class="${styles.highlightRed}">$1</span>`
      );
    });

    yellow.forEach((word) => {
      const regex = new RegExp(`(${word})`, "gi");
      highlightedMessage = highlightedMessage.replace(
        regex,
        `<span class="${styles.highlightYellow}">$1</span>`
      );
    });

    return highlightedMessage;
  };

  // The optimizaton queries. Change as needed
  const queries = [
    "Using the same structure and process as described in the previous instructions, please provide a keyword optimization analysis for a Rakuten listing. Assume the listing is similar to the one previously discussed but with different results. Do not include any specific details such as item URL, title, or catch copy. Please follow these steps: 関連キーワード: List a comprehensive set of related keywords that could enhance search visibility for a product similar to the one discussed. Ignored Keywords Because Not in Content: List any keywords from the provided set that are not directly referenced or implied in the product content. Used from List Although Not Directly in Content: Document keywords from the initial list that, while not explicitly mentioned in the products content, are closely related to the product and included in the related keywords section. Inclusion of Synonyms/Similar Terms: Provide additional synonyms or closely related terms derived from the product content to broaden search visibility. Ensure that the response adheres to the same structure and format as the previous response and is clear, concise, and directly relevant. Format it exaclty as such '関連キーワード:'",
    "Using the same structure and process as described in the previous instructions, please provide a keyword optimization analysis for a Rakuten listing. Assume the listing is similar to the one previously discussed but with different results. Do not include any specific details such as item URL, title, or catch copy. Please follow these steps: 関連キーワード: List a comprehensive set of related keywords that could enhance search visibility for a product similar to the one discussed. Ignored Keywords Because Not in Content: List any keywords from the provided set that are not directly referenced or implied in the product content. Used from List Although Not Directly in Content: Document keywords from the initial list that, while not explicitly mentioned in the products content, are closely related to the product and included in the related keywords section. Inclusion of Synonyms/Similar Terms: Provide additional synonyms or closely related terms derived from the product content to broaden search visibility. Ensure that the response adheres to the same structure and format as the previous response and is clear, concise, and directly relevant. MAKE SURE THE RESPONSE IS DIFFERENT FROM THE PREVIOUS ONE. Format it exaclty as such '関連キーワード:'",
    "From the previous 3 responses. Can you provide a score for each out of 10 based on how well they would perform on Rakuten based off maximizing search visibility. Format it exactly like this: Option 1: score, Option 2: score, Option 3: score",
  ];

  // Counter keeps track of which query is being executed
  let counter = 0;
  let unrelatedWords = [];
  let inclusionWords = [];

  const mutex = {
    locked: false,
    lock() {
      this.locked = true;
    },
    unlock() {
      this.locked = false;
    },
    async execute(fn) {
      while (this.locked) {
        await new Promise((resolve) => setTimeout(resolve, 10)); // Wait until unlocked
      }
      this.lock();
      try {
        await fn();
      } finally {
        this.unlock();
      }
    },
  };

  // Send query message to GPT

  const sendMessage = async (message) => {
    await mutex.execute(async () => {
    // Append user message to chat history
    setAllChat((prev) => [...prev]);
  
    const fetchWithTimeout = async (url, options, timeout = 5000) => {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), timeout)
      );
      return Promise.race([fetch(url, options), timeoutPromise]);
    };
  
    const attemptFetch = async (retryCount = 0) => {
      try {
        const response = await fetchWithTimeout("/api/generate?endpoint=chat", {
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
          let accumulatedData = "";
  
          eventSource.onmessage = function (event) {
            const parsedData = JSON.parse(event.data);
  
            if (parsedData.end_of_stream) {
              accumulatedData = accumulatedData.replace(/- /g, "");
              accumulatedData = accumulatedData.replace(/\*/g, "");
              eventSource.close();
              console.log("End of stream received");
  
              const paragraphs = accumulatedData.split("\n\n");
              const firstParagraph = paragraphs[0];
              let moreInfo = "";
              if (counter < 5) {
                moreInfo = paragraphs.slice(1).join("<br><br>");
                moreInfo = moreInfo.split(": \n").join("<br>");
                moreInfo = moreInfo.split("\n").join("<br>");
                moreInfo = moreInfo.split(", ").join("<br>");
                moreInfo = moreInfo.split(": ").join("<br>");
              }
              let result = firstParagraph.replace("関連キーワード: ", "");
              let formattedPara = result.replace(/,/g, "").replace(/ /g, "\n");
  
              if (counter < 4) {
                const startMarker = "Used from List Although Not Directly in Content";
                const endMarker = "Inclusion of Synonyms/Similar Terms";
  
                const startIndex = accumulatedData.indexOf(startMarker) + startMarker.length;
                const endIndex = accumulatedData.indexOf(endMarker);
  
                const extractedString = accumulatedData.substring(startIndex, endIndex).trim();
                unrelatedWords = extractedString.split("\n").map((word) => word.trim()).filter((word) => word);
  
                const startIndex2 = accumulatedData.indexOf(endMarker) + endMarker.length;
                const extractedString2 = accumulatedData.substring(startIndex2).trim();
  
                inclusionWords = extractedString2.split("\n").map((word) => word.trim()).filter((word) => word);
              }
  
              let highlighted = highlightWords(formattedPara, unrelatedWords, inclusionWords);
              moreInfo = highlighted + "<br><br>" + moreInfo;
  
              setAllChat((prevAllChat) => {
                const newAllChat = [...prevAllChat];
  
                if (counter === 2) {
                  setLoadingTextUpdate("Generating option 3");
                  newAllChat.push({
                    role: "options",
                    content: highlighted,
                    info: moreInfo,
                    noHighlight: formattedPara,
                  });
                } else if (counter === 3) {
                  setLoadingTextUpdate("Generating score.");
                  counter += 1;
  
                  newAllChat.push({
                    role: "options",
                    content: highlighted,
                    info: moreInfo,
                    noHighlight: formattedPara,
                  });
                } else if (counter === 4) {
                  newAllChat.push({
                    role: "score",
                    content: highlighted,
                    info: moreInfo,
                    noHighlight: formattedPara,
                  });
                  counter = 0;
                  setIsLoading(false);
                } else {
                  setLoadingTextUpdate("Generating option 2");
                  newAllChat.push({
                    role: "options",
                    content: highlighted,
                    info: moreInfo,
                    noHighlight: formattedPara,
                  });
                }
                return newAllChat;
              });
  
              if (counter < 3) {
                counter += 1;
                sendMessage(queries[counter - 1]);
              }
            } else {
              accumulatedData += parsedData;
            }
          };
  
          eventSource.onopen = () => console.log("Connection to stream opened");
  
          eventSource.onerror = function (error) {
            console.error("Stream error:", error);
            eventSource.close();
            console.log("Connection to stream closed");
            if (retryCount < 3) {
              console.log(`Retrying stream... (${retryCount + 1}/3)`);
              attemptFetch(retryCount + 1); // Retry on failure
            }
          };
        }
      } catch (error) {
        if (retryCount < 3) {
          console.log(`Retrying... (${retryCount + 1}/3)`);
          await attemptFetch(retryCount + 1);
        } else {
          console.error("Failed after 3 retries:", error);
        }
      }
    };
  
    await attemptFetch();
    });
  };
  

  // Go to the saved keywords page
  const showTable = async () => {
    if (isLoading) {
      setShowMessage2(true);
      return;
    }
    setPageState(allChat);
    router.push("/items");
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
    if (end < allChat.length - 1 && allChat[end + 1].role === "score") {
      end++;
    }
    return { start, end };
  };

  // Add selected keywords to the databse
  const addItem = async (content, index) => {
    await mutex.execute(async () => {
    if (allChat[index].role === "score") {
      toggleContent(index);
      return;
    }
  
    let { start, end } = findBlockIndices(index);
  
    if (isLoading && (end - start) !== 3) {
      setShowMessage2(true);
      return;
    }
  
    try {
      const response = await fetch("/api/addItem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: content }),
      });
      
      const result = await response.json();
      if (result.success) {
        setItems([...items, result.data]);
  
        // Use a functional update to ensure you get the latest version of allChat
        setAllChat((prevAllChat) => {
          let { start, end } = findBlockIndices(index);
          // Filter based on the previous state of allChat
          const newChat = prevAllChat.filter((_, idx) => idx < start || idx > end);
          
          return newChat; // Return the updated allChat state
        });
  
        // Update other state variables as needed
        let ind = Math.floor(index / 4) + 1;
        setListing((prevListing) => prevListing.filter((_, i) => i !== ind - 1));
        setUrl((prevUrl) => prevUrl.filter((_, i) => i !== ind - 1));
        const newExpanded = expanded.slice(4);
        setExpanded(newExpanded);
        setShowMessage(true);
      } else {
        alert("Failed to add item.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to add item.");
    }
  });
  };
  

  const toggleContent = (index) => {
    const newExpanded = [...expanded];
    newExpanded[index - 3] = !newExpanded[index - 3];
    newExpanded[index - 2] = !newExpanded[index - 2];
    newExpanded[index - 1] = !newExpanded[index - 1];
    setExpanded(newExpanded);
  };

  return (
    <div className={styles.body}>
      <Head>
        <title>TENKI Keyword Optimizer</title>
      </Head>
      <div className={styles.header}>
        <h1 className={styles.heading1}>TENKI-JAPAN Keyword Optimizer</h1>
        <div className={styles.buttonGroup}>
          <button
            className={styles.dataButton}
            type="button"
            onClick={showTable}
          >
            Saved Keywords
          </button>
          <a
            href={url[0]}
            className={styles.dataButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            See Listing
          </a>
        </div>
      </div>
      <div className={styles.pageContainer}>
        <div className={styles.leftTextBox}>
          <div>
            <RawHtmlComponent
              htmlContent={listing[0]}
              width="100%"
              height="100vh"
            />
          </div>
        </div>
        <div className={styles.chatContainer}>
          {allChat.map((msg, index) => (
            <div
              key={index}
              className={
                msg.role === "score" ? styles.chatBox2 : styles.chatBox
              }
            >
              <div className={`${msg.role === "score" ? styles.scoreBox : ""} ${styles.contentArea}`}>
                <div
                  className={styles.leftText}
                  dangerouslySetInnerHTML={{
                    __html: expanded[index] ? msg.info : msg.content,
                  }}
                />
              </div>
              {msg.role !== "score" && (
                <button
                  onClick={() => addItem(msg.noHighlight, index)}
                  className={styles.myButton}
                >
                  Save
                </button>
              )}
              {msg.role === "score" && (
                <button
                  onClick={() => addItem(msg.noHighlight, index)}
                  className={styles.myButton2}
                >
                  Details
                </button>
              )}
            </div>
          ))}
          {isLoading && <p className={styles.loadingText}>{loadingText}</p>}
          {isLoading && (
            <p className={styles.loadingTextsmall}>{loadingTextUpdate}</p>
          )}
        </div>
      </div>
      <div
        className={`${styles.successMessage} ${
          showMessage ? styles.show : styles.hide
        }`}
      >
        Successfully Saved
      </div>
      <div
        className={`${styles.errorMessage} ${
          showMessage2 ? styles.show : styles.hide
        }`}
      >
        Wait for analysis to finish
      </div>
    </div>
  );
}
