import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // other fields
});

export default mongoose.models.Item || mongoose.model('Item', ItemSchema);
