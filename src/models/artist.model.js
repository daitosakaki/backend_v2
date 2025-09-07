const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const artistSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    bio: { type: String },
    profileImageUrl: { type: String },
}, { timestamps: true });

const Artist = mongoose.model('Artist', artistSchema);
module.exports = Artist;