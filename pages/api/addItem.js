import clientPromise from '../../lib/mongodb';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const client = await clientPromise;
      const db = client.db('TenkiKeywords');

      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }

      const newItem = {
        name,
      };

      const result = await db.collection('SavedKeywords').insertOne(newItem);

      // Access the insertedId from the result
      res.status(200).json({ success: true, data: { _id: result.insertedId, name } });
    } catch (error) {
      console.error('Error inserting item:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
};

export default handler;
