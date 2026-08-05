const TwoYearPlan = require('../models/TwoYearPlan');

exports.submitTwoYearPlan = async (req, res) => {
  try {
    const { user, status, _id, plan } = req.body;
    if (!_id) {
      // New plan
      const existing = await TwoYearPlan.findOne({ user });
      if (existing && existing.status === 'Submitted') {
        return res.status(400).json({ error: '2 Year Plan already submitted.' });
      }
      if (existing) {
        // Allow update if not submitted
        return res.status(200).json({ message: 'Draft already exists.', plan: existing });
      }
      const newPlan = new TwoYearPlan({
        user,
        plan,
        status: status === 'Submitted' ? 'Submitted' : 'Saved',
        submittedAt: status === 'Submitted' ? new Date() : undefined
      });
      await newPlan.save();
      return res.json({ message: status === 'Submitted' ? 'Two year plan submitted' : 'Two year plan saved', plan: newPlan });
    } else {
      // Update existing plan
      const existing = await TwoYearPlan.findById(_id);
      if (!existing) return res.status(404).json({ error: 'Plan not found.' });
      if (existing.status === 'Submitted') {
        return res.status(400).json({ error: '2 Year Plan already submitted.' });
      }
      existing.plan = plan;
      if (status === 'Submitted') {
        existing.status = 'Submitted';
        existing.submittedAt = new Date();
      }
      await existing.save();
      return res.json({ message: status === 'Submitted' ? 'Two year plan submitted' : 'Two year plan saved', plan: existing });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTwoYearPlan = async (req, res) => {
  try {
    const plans = await TwoYearPlan.find({ user: req.query.user });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
