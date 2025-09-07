// src/models/bookmark.model.js
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const bookmarkSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: 'User', required: true, index: true },
    contentId: { type: ObjectId, required: true, refPath: 'contentType' },
    contentType: { type: String, required: true, enum: ['Post', 'Comment', 'Video'] },
}, { timestamps: true });

bookmarkSchema.index({ user: 1, contentId: 1, contentType: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
module.exports = Bookmark;