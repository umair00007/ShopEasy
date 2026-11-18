import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // creates a unique index, so two users can never share an email
      lowercase: true,
      trim: true,
    },
    // select:false => the hash is NOT returned by queries unless we ask for it explicitly.
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    address: addressSchema,
    // Password reset: we store only a HASH of the emailed token (like a password), plus an expiry.
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Runs before every save: hash the password only if it was set or changed.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12); // 12 = cost factor (2^12 rounds)
});

// Creates a random token, stores its SHA-256 hash, and returns the raw token (to be emailed).
// If the database leaks, the hashes can't be used to reset anyone's password.
userSchema.methods.createResetToken = function () {
  const raw = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(raw).digest('hex');
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // valid for 15 minutes
  return raw;
};

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Whenever a user is converted to JSON, drop the password hash.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
