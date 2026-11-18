import mongoose from 'mongoose';

export const ORDER_STATUSES = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // A SNAPSHOT of what was bought. If the product's price changes or it is deleted later,
    // the order history must still show what the customer actually paid.
    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String }, // S3 key or URL of the first image
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      line1: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
    },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
    razorpayOrderId: { type: String, index: true },
    paymentId: { type: String },
    paidAt: { type: Date },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
