const WithdrawalMethod = require('../models/WithdrawalMethod');
const User = require('../models/User');

const list = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user || user.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Only freelancers can manage withdrawal methods' });
        }
        const methods = await WithdrawalMethod.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
        res.json(methods);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const add = async (req, res) => {
    try {
        const userId = req.user.id;
        const { method, phoneNumber, accountNumber, bankName, label } = req.body || {};

        const user = await User.findById(userId);
        if (!user || user.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Only freelancers can add withdrawal methods' });
        }

        const validMethods = ['instapay', 'vodafone_cash', 'bank'];
        if (!method || !validMethods.includes(method)) {
            return res.status(400).json({ msg: 'Invalid method. Use instapay, vodafone_cash, or bank' });
        }

        if ((method === 'instapay' || method === 'vodafone_cash') && !phoneNumber?.trim()) {
            return res.status(400).json({ msg: 'Phone number is required for InstaPay and Vodafone Cash' });
        }
        if (method === 'bank' && (!accountNumber?.trim() || !bankName?.trim())) {
            return res.status(400).json({ msg: 'Account number and bank name are required for bank transfer' });
        }

        const existing = await WithdrawalMethod.countDocuments({ userId });
        const doc = new WithdrawalMethod({
            userId,
            method,
            phoneNumber: (method === 'instapay' || method === 'vodafone_cash') ? phoneNumber.trim() : undefined,
            accountNumber: method === 'bank' ? accountNumber.trim() : undefined,
            bankName: method === 'bank' ? bankName.trim() : undefined,
            label: label?.trim() || undefined,
            isDefault: existing === 0
        });
        await doc.save();
        res.json(doc);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const remove = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const user = await User.findById(userId);
        if (!user || user.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Only freelancers can remove withdrawal methods' });
        }

        const method = await WithdrawalMethod.findOne({ _id: id, userId });
        if (!method) return res.status(404).json({ msg: 'Withdrawal method not found' });

        await WithdrawalMethod.findByIdAndDelete(id);
        if (method.isDefault) {
            const next = await WithdrawalMethod.findOne({ userId }).sort({ createdAt: -1 });
            if (next) {
                next.isDefault = true;
                await next.save();
            }
        }
        res.json({ msg: 'Removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const setDefault = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const user = await User.findById(userId);
        if (!user || user.role !== 'freelancer') {
            return res.status(403).json({ msg: 'Only freelancers can set default withdrawal method' });
        }

        const method = await WithdrawalMethod.findOne({ _id: id, userId });
        if (!method) return res.status(404).json({ msg: 'Withdrawal method not found' });

        await WithdrawalMethod.updateMany({ userId }, { isDefault: false });
        method.isDefault = true;
        await method.save();
        res.json(method);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

module.exports = { list, add, remove, setDefault };
