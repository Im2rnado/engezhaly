const mongoose = require('mongoose');

const SequenceSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    value: { type: Number, default: 999 }
});

module.exports = mongoose.model('Sequence', SequenceSchema);
