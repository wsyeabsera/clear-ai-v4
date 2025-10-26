import mongoose from 'mongoose';

const AuthorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  bio: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

export const Author = mongoose.models.Author || mongoose.model('Author', AuthorSchema);
