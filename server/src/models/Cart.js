import mongoose from 'mongoose';

// One cart document per logged-in user. Guests keep their cart in the browser's localStorage.
// We store only product id + quantity. Name/price/image are looked up fresh from Product every time,
// so a price change in admin is reflected immediately.
const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1, max: 10000 },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Cart', cartSchema);
