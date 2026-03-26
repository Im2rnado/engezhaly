const Sequence = require('../models/Sequence');

const getNextOrderNumber = async () => {
    const sequence = await Sequence.findOneAndUpdate(
        { name: 'orderNumber' },
        { $inc: { value: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return sequence.value;
};

module.exports = { getNextOrderNumber };
