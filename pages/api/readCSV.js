import Papa from 'papaparse';

export function fetchCsv(callback) {
    fetch('/data/glv-sample.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob(); // Fetch as blob to handle encoding issues
        })
        .then(blob => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const text = e.target.result;
                // console.log('CSV File Contents:', text); // Debug: Log the raw CSV content
                Papa.parse(text, {
                    header: false, // No header, treat all rows as data
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        // console.log('Parsed Results:', results); // Debug: Log the parsed results
                        callback(results.data); // Pass all rows to the callback
                    },
                    error: function(error) {
                        console.error('Parsing Error:', error); // Debug: Log parsing errors
                    }
                });
            };
            reader.readAsText(blob, 'UTF-8'); // Specify encoding as UTF-8 to handle Japanese characters
        })
        .catch(error => {
            console.error('Error fetching the CSV file:', error);
        });
}
