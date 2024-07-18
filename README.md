# TENKI-JAPAN Keyword Optimizer Quickstart

This node.js app takes in a listing from Rakuten and provides options for more optimized keywords to maximie search visibility. It uses the [Chat Completions API](https://platform.openai.com/docs/api-reference/chat) to create a simple chat app with streaming.

## Basic request

To send your first API request with the [OpenAI Node SDK](https://github.com/openai/openai-node), make sure you have the right [dependencies installed](https://platform.openai.com/docs/quickstart?context=node) and then run the following code:

## Setup

1. If you don’t have Node.js installed, install it from [nodejs.org](https://nodejs.org/en/) (Node.js version >= 16.0.0 required)

2. Clone this repository

3. Navigate into the project directory

   ```bash
   $ cd TENKI-Internship
   ```

4. Install the requirements

   ```bash
   $ npm install
   ```

5. Make a copy of the example environment variables file

   On Linux systems: 
   ```bash
   $ cp .env.example .env
   ```
   On Windows:
   ```powershell
   $ copy .env.example .env
   ```
6. Add your [API key](https://platform.openai.com/account/api-keys) to the newly created `.env` file

7. Set up a MongoDB database using MongoDB Atlas.

8. Sign Up: Sign up for a MongoDB Atlas account at MongoDB Atlas.

9. Create a Cluster: Follow the instructions to create a new cluster.

10. Configure Network Access: Allow access to your cluster from your IP address or set it to allow access from anywhere.

11. Create a Database User: Set up a database user with a username and password.

12. Get Connection String: Retrieve your MongoDB connection string. It will look something like this: mongodb+srv://<username>:<password>@cluster0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
Add it to the .env file.

13. Run the app

   ```bash
   $ npm run dev
   ```

You should now be able to access the app at [http://localhost:3000](http://localhost:3000)!
