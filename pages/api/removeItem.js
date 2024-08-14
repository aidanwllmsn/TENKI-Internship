import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';

/** Connect and remove item from database */

const handler = async (req, res) => {
  if (req.method === 'DELETE') {
    try {
      const client = await clientPromise;
      const db = client.db('TenkiKeywords');

      const { id } = req.body;

      const result = await db.collection('SavedKeywords').deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 1) {
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ success: false, message: 'Item not found' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
};

export default handler;
