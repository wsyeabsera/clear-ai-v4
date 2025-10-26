import mongoose from 'mongoose';

const PictureSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

export const Picture = mongoose.models.Picture || mongoose.model('Picture', PictureSchema);
