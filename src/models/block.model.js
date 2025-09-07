const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const blockSchema = new mongoose.Schema({
    // Engelleme eylemini yapan kullanıcı (Engelleyen)
    blocker: { 
        type: ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },
    
    // Engellenen kullanıcı
    blocking: { 
        type: ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },
}, { timestamps: true });

// Bir kullanıcının başka bir kullanıcıyı sadece bir kez engelleyebilmesini garantilemek için.
blockSchema.index({ blocker: 1, blocking: 1 }, { unique: true });

const Block = mongoose.model('Block', blockSchema);
module.exports = Block;