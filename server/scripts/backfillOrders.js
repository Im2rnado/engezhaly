const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('../models/Order');
const Sequence = require('../models/Sequence');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/engezhaly';

async function backfill() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const orders = await Order.find({ 
            $or: [
                { orderNumber: { $exists: false } },
                { orderNumber: null }
            ]
        }).sort({ createdAt: 1 });
        
        console.log(`Found ${orders.length} orders to backfill`);

        let currentVal = 1000;
        const seq = await Sequence.findOne({ name: 'orderNumber' });
        if (seq) {
            currentVal = seq.value;
        } else {
            // Initialize sequence if not exists
            await new Sequence({ name: 'orderNumber', value: 1000 }).save();
        }

        for (const order of orders) {
            order.orderNumber = currentVal;
            // Use findOneAndUpdate to bypass hooks if needed, but here we WANT to set it
            await Order.updateOne({ _id: order._id }, { $set: { orderNumber: currentVal } });
            console.log(`Updated order ${order._id} with number ${currentVal}`);
            currentVal++;
        }

        // Update sequence final value
        await Sequence.findOneAndUpdate({ name: 'orderNumber' }, { value: currentVal });

        console.log(`Backfill complete. Next order will be ${currentVal}`);
        process.exit(0);
    } catch (err) {
        console.error('Backfill failed:', err);
        process.exit(1);
    }
}

backfill();
