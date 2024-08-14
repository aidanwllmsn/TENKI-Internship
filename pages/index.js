import Head from "next/head";
import { useState, useEffect } from "react";
import { useWaitForLoading } from "../hooks/useWaitForLoading";
import styles from "./index.module.css";
import Papa from "papaparse";
import RawHtmlComponent from "./api/iframe";

/**
 * index.js - This file handles the content of the main page. On startup, it displays a "Start Generation"
 * button, Once pressed, it reads from a CSV file of Rakuten listings data, parses the data, then processes
 * it to be sent to ChatGPT API. The program sends 4 queries total to ChatGPT for each listing. This consists
 * of an initial query asking for optimized keywords for a listing, more optimized keywords, more optimized
 * keywords again, and a score of the 3 options. The page will display 3 options for each listing,
 * along with a score for each. The response is then stores in state "allChat", an array of {content, role}
 * objects, where each object makes a new options/score box. There are two buttons for each listing: Save & Detail.
 *
 * Save - Save the specific keyword option selected to the data base and delete that listing
 * Detial - Show the rest of the answer showing more details about the keywords
 *
 * Keywords that are "Used from List Although Not Directly in Content" are highlighted red and "Inclusion of
 * Synonyms/Similar Terms" is highlighted yellow.
 *
 * To save processing power, the program analyzes data in chunks and displays the results for 3 listings at a time.
 * However, once the initial 3 listings are finished analyzing, 3 more listings are analyzed in the background for
 * efficiency, but are not displayed until one of the first 3 is saved and removed. After saving the first 3 listings
 * and all 3 of the background listings are displayed, it begins generating the next chunk of 3 in the background.
 * This process continues infinitly until all the listing have been read from the CSV file.
 *
 * On the left half of the screen, the program uses a queue to display the listing content (HTML) of the top listing
 * from the right half. It uses the queue to update the listing content as the options from the right are saved/removed
 */

export default function Home() {
  const [isProcessed, setIsProcessed] = useState(false); // Check if current chunk of 6 has finished analyzing
  const [isLoading, setIsLoading] = useState(false); // If a listing is currently being analyzed
  const [listing, setListing] = useState([]); // Queue for listing HTML data
  const [allChat, setAllChat] = useState([]); // Where all the responses are stored, [{content, role},...]
  const [loadingText, setLoadingText] = useState("Analyzing"); // Analyzing text animation
  const [loadingTextUpdate, setLoadingTextUpdate] = useState(
    "Generating option 1"
  ); // Dynamically updating loading text
  const [showMessage, setShowMessage] = useState(false); // Display "Successfully Saved" message
  const [showMessage2, setShowMessage2] = useState(false); // Display "Wait for analysis to finish" message
  const [allRows, setAllRows] = useState([]); // All rows of data
  const [currentRows, setCurrentRows] = useState([]); // Current row of data chunk
  const [currentIndex, setCurrentIndex] = useState(0); // Current index of data chunk
  const [url, setUrl] = useState([]); // Queue for listing URLs in order
  const [expanded, setExpanded] = useState(allChat.map(() => false)); // Keeps track of which listings are expanded
  const [isButtonVisible, setIsButtonVisible] = useState(true); // Hides "Start Generation" button
  const waitForLoading = useWaitForLoading(isLoading); // External function to synchronize when responses finish

  /** DATA READING - This section reads the data from a CSV file of a specific 
  format and parses it into variables*/

  // Read from the CSV file in chunks
  useEffect(() => {
    if (!isProcessed && allRows.length === 0) {
      fetch("/data/glv-sample2.csv") // File to read from (change as necessary)
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
            complete: function () {},
          });
        })
        .catch((error) => {
          console.error("Error reading CSV:", error);
        });
    }
  }, [isProcessed, allRows]);

  // Once data is read, create a string for the initial query for each row of the read CSV file.
  useEffect(() => {
    if (currentRows.length > 0) {
      const formattedStrings = currentRows.map((row) => {
        // Converts each row into desired initial query to be sent to chatGPT
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

Provide the answer in this exact format "関連キーワード: {新しい関連キーワード}. End of Instructions Item: https://item.rakuten.co.jp/${
          row["shop_id_url"]
        }/${row["item_id_url"]}/, ID: ${
          row["item_id_url"]
        }, Keywords: ${Object.values(row).slice(9).join(" ")}, title: ${
          row["ftp_title"]
        }, content: ${row["ftp_desc_pc"]}`; // add desired columns as variables to each query
        setListing((prevListing) => [...prevListing, `${row["ftp_desc_pc"]}`]); // Enqueue the HTML content data into a queue
        const currentUrl = `https://item.rakuten.co.jp/${row["shop_id_url"]}/${row["item_id_url"]}/`; // Create URL
        setUrl((prevUrl) => [...prevUrl, currentUrl]); // Enqueue URL to be used for "See Listing" button
        return concatenatedString; // Store all the initial queries as an array of strings to concatenatedString
      });
      processData(formattedStrings); // Send queries so be processed
    }
  }, [currentRows]);

  /** DATA PROCESSING - This section processes the queries in chunks and determines when to
   * generate the next chunk*/

  // Function to process initial queries sequentially
  const processData = async (strings) => {
    // Iterate chunk of initial queries
    for (const str of strings) {
      setLoadingTextUpdate("Generating option 1"); // Reset loading text
      setIsLoading(true);
      await sendMessage(str.trim()); // Send current string
      await waitForLoading(); // Wait for all subqueries to finish before send next initial query
    }
    setIsProcessed(true); // Once all queries in chunk are finished, set as processed
  };

  // Load first chunk when "Start Generation" button is clicked
  const loadFirstChunk = () => {
    if (allRows.length > 0 && currentRows.length === 0) {
      setIsButtonVisible(false); // Hide button
      setIsLoading(true);
      loadNextChunk(allRows, 0); // Load the first chunk
    }
  };

  // Load the next chunk
  const loadNextChunk = (data, startIndex) => {
    let chunkSize = 6; // Chunk size (3 shown, 3 hidden)
    const nextChunk = data.slice(startIndex, startIndex + chunkSize); // Update and save next chunk
    setCurrentRows(nextChunk);
    setCurrentIndex(startIndex + nextChunk.length);
  };

  // Detect when to load the next chunk
  useEffect(() => {
    // Next chunk automaticall loads when there is lass than 13 responses (3 listings)
    if (allChat.length < 13 && isProcessed) {
      setIsLoading(true);
      setIsProcessed(false);
      loadNextChunk(allRows, currentIndex);
    }
  }, [allChat, isProcessed]);

  /** ChatGPT API HANDLING - Sends messages to ChatGPT, handles the responses to be displayed*/

  // Optimizaton queries. The 3 other queries that are sent to ChatGPT to optimize/score each listing.
  // Modify as needed
  const queries = [
    "Using the same structure and process as described in the previous instructions, please provide a keyword optimization analysis for a Rakuten listing. Assume the listing is similar to the one previously discussed but with different results. Do not include any specific details such as item URL, title, or catch copy. Please follow these steps: 関連キーワード: List a comprehensive set of related keywords that could enhance search visibility for a product similar to the one discussed. Ignored Keywords Because Not in Content: List any keywords from the provided set that are not directly referenced or implied in the product content. Used from List Although Not Directly in Content: Document keywords from the initial list that, while not explicitly mentioned in the products content, are closely related to the product and included in the related keywords section. Inclusion of Synonyms/Similar Terms: Provide additional synonyms or closely related terms derived from the product content to broaden search visibility. Ensure that the response adheres to the same structure and format as the previous response and is clear, concise, and directly relevant. Format it exaclty as such '関連キーワード:'",
    "Using the same structure and process as described in the previous instructions, please provide a keyword optimization analysis for a Rakuten listing. Assume the listing is similar to the one previously discussed but with different results. Do not include any specific details such as item URL, title, or catch copy. Please follow these steps: 関連キーワード: List a comprehensive set of related keywords that could enhance search visibility for a product similar to the one discussed. Ignored Keywords Because Not in Content: List any keywords from the provided set that are not directly referenced or implied in the product content. Used from List Although Not Directly in Content: Document keywords from the initial list that, while not explicitly mentioned in the products content, are closely related to the product and included in the related keywords section. Inclusion of Synonyms/Similar Terms: Provide additional synonyms or closely related terms derived from the product content to broaden search visibility. Ensure that the response adheres to the same structure and format as the previous response and is clear, concise, and directly relevant. MAKE SURE THE RESPONSE IS DIFFERENT FROM THE PREVIOUS ONE. Format it exaclty as such '関連キーワード:'",
    "From the previous 3 responses. Can you provide a score for each out of 10 based on how well they would perform on Rakuten based off maximizing search visibility. Format it exactly like this: Option 1: score, Option 2: score, Option 3: score",
  ];

  // Variables for sendMessage
  let counter = 0; // Keep track of current query
  let unrelatedWords = []; // Store unrelated words (highlighted red)
  let inclusionWords = []; // Store inclusion words (highlighted yellow)

  // Send query message to ChatGPT and stores responses
  const sendMessage = async (message) => {
    // Mutex to not interfere with addItem()
    await mutex.execute(async () => {
      // Append user message to chat history
      setAllChat((prev) => [...prev]);

      // Timeout for ChatGPT API connection
      const fetchWithTimeout = async (url, options, timeout = 5000) => {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), timeout)
        );
        return Promise.race([fetch(url, options), timeoutPromise]);
      };

      // Timeout/retry for API connection
      const attemptFetch = async (retryCount = 0) => {
        // Send message to ChatGPT
        try {
          const response = await fetchWithTimeout(
            "/api/generate?endpoint=chat",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ message }),
            }
          );

          // convert the response from a web request into a JavaScript object.
          const data = await response.json();

          // Check if successful
          if (data.success) {
            // Open a connection to receive streamed responses
            const eventSource = new EventSource(
              "/api/generate?endpoint=stream"
            );
            let accumulatedData = ""; // Store whole response

            eventSource.onmessage = function (event) {
              // Store data from stream
              const parsedData = JSON.parse(event.data);

              // Once stream of data has finished
              if (parsedData.end_of_stream) {
                eventSource.close();
                console.log("End of stream received");

                // Fomratting
                accumulatedData = accumulatedData
                  .replace(/- /g, "")
                  .replace(/\*/g, "");
                const paragraphs = accumulatedData.split("\n\n"); // Get keywords only
                const firstParagraph = paragraphs[0];

                // Get details
                let moreInfo = "";
                if (counter < 5) {
                  moreInfo = paragraphs.slice(1).join("<br><br>");
                  moreInfo = moreInfo.split(": \n").join("<br>");
                  moreInfo = moreInfo.split("\n").join("<br>");
                  moreInfo = moreInfo.split(", ").join("<br>");
                  moreInfo = moreInfo.split(": ").join("<br>");
                }

                // More formatting
                let result = firstParagraph.replace("関連キーワード: ", "");
                let formattedPara = result
                  .replace(/,/g, "")
                  .replace(/ /g, "\n");
                if (counter < 4) {
                  const startMarker =
                    "Used from List Although Not Directly in Content";
                  const endMarker = "Inclusion of Synonyms/Similar Terms";

                  const startIndex =
                    accumulatedData.indexOf(startMarker) + startMarker.length;
                  const endIndex = accumulatedData.indexOf(endMarker);

                  const extractedString = accumulatedData
                    .substring(startIndex, endIndex)
                    .trim();
                  unrelatedWords = extractedString
                    .split("\n")
                    .map((word) => word.trim())
                    .filter((word) => word);

                  const startIndex2 =
                    accumulatedData.indexOf(endMarker) + endMarker.length;
                  const extractedString2 = accumulatedData
                    .substring(startIndex2)
                    .trim();

                  inclusionWords = extractedString2
                    .split("\n")
                    .map((word) => word.trim())
                    .filter((word) => word);
                }

                // Highlight desired words using HTML
                let highlighted = highlightWords(
                  formattedPara,
                  unrelatedWords,
                  inclusionWords
                );
                moreInfo = highlighted + "<br><br>" + moreInfo;

                // Store response in allChat to be displayed
                setAllChat((prevAllChat) => {
                  const newAllChat = [...prevAllChat];

                  // Determine action for each query response
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

                // Recursively send other three optimization queries
                if (counter < 3) {
                  counter += 1;
                  sendMessage(queries[counter - 1]);
                }
              } else {
                // When stream is not finished yet, accumulate parsed data
                accumulatedData += parsedData;
              }
            };

            eventSource.onopen = () =>
              console.log("Connection to stream opened");

            // Error handling
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

  /** MISCELLANEOUS FUNCTIONS - Functions for other components and animations*/

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

  // Mutex to make allChat mutually exclusive
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

  // Open the saved keywords page (opens new tab to not interfere with API processing)
  const showTable = async () => {
    window.open("/items", "_blank");
  };

  // Find the option blocks for filtering (when an option is saved, delete entire listing)
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

      if (isLoading && end - start !== 3) {
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
          // Use a functional update to ensure you get the latest version of allChat
          setAllChat((prevAllChat) => {
            let { start, end } = findBlockIndices(index);
            // Filter based on the previous state of allChat
            const newChat = prevAllChat.filter(
              (_, idx) => idx < start || idx > end
            );

            return newChat; // Return the updated allChat state
          });

          // Determine which chunk to remove from queues
          let ind = Math.floor(index / 4) + 1;
          setListing((prevListing) =>
            prevListing.filter((_, i) => i !== ind - 1)
          );
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

  // Toggle to show details of specific listing
  const toggleContent = (index) => {
    const newExpanded = [...expanded];
    newExpanded[index - 3] = !newExpanded[index - 3];
    newExpanded[index - 2] = !newExpanded[index - 2];
    newExpanded[index - 1] = !newExpanded[index - 1];
    setExpanded(newExpanded);
  };

  // HTML content to be displayed
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
        {isButtonVisible && (
          <button
            className={styles.startButton}
            type="button"
            onClick={loadFirstChunk}
          >
            Start Generation
          </button>
        )}
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
          {allChat.slice(0, 12).map((msg, index) => (
            <div
              key={index}
              className={
                msg.role === "score" ? styles.chatBox2 : styles.chatBox
              }
            >
              <div
                className={`${msg.role === "score" ? styles.scoreBox : ""} ${
                  styles.contentArea
                }`}
              >
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
          {isLoading && allChat.length < 12 && (
            <p className={styles.loadingText}>{loadingText}</p>
          )}
          {isLoading && allChat.length < 12 && (
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
