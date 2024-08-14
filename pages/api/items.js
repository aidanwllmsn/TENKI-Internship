import clientPromise from '../../lib/mongodb';

/** Connect and fetch items from databse */

export default async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db('TenkiKeywords'); // Replace with your database name

    const items = await db.collection('SavedKeywords').find({}).toArray(); // Replace with your collection name

    res.status(200).json({ success: true, data: items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
