const fs = require('fs');
const path = require('path');

const getData = () => {
  const filePath = path.join(process.cwd(), 'data', 'data.json');
  const jsonData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(jsonData);
};

module.exports = getData;
