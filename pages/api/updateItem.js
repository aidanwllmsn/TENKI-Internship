import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const { id, name } = req.body;

    if (!id || !name) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    try {
      const client = await clientPromise;
      const db = client.db('TenkiKeywords');

      // Ensure id is a valid ObjectId
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID format' });
      }

      // Fetch the item to ensure it exists
      const item = await db.collection('SavedKeywords').findOne({ _id: new ObjectId(id) });

      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      // Update the item
      const result = await db.collection('SavedKeywords').updateOne(
        { _id: new ObjectId(id) },
        { $set: { name: name } }
      );

      if (result.modifiedCount === 1) {
        res.status(200).json({ success: true, message: 'Item updated successfully' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to update item' });
      }
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}
