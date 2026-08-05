const express = require('express');
const router = express.Router();
const Form = require('../models/Form');
const { submitForm, getForm, getWeeklyProgressWeeks } = require('../controllers/formController');
const { submitTwoYearPlan, getTwoYearPlan } = require('../controllers/twoYearPlanController');

router.post('/submit', submitForm);
// router.put('/review/:id', reviewForm); // Temporarily remove or comment out this line until reviewForm is re-implemented
router.post('/two-year-plan', submitTwoYearPlan);
router.get('/two-year-plan', getTwoYearPlan);
router.get('/submit', getForm);
router.get('/weekly-weeks', getWeeklyProgressWeeks);

// PUT: Update a weekly form by ID
router.put('/submit/:id', async (req, res) => {
  try {
    const formId = req.params.id;
    const update = req.body;
    const updatedForm = await Form.findByIdAndUpdate(formId, update, { new: true });
    if (!updatedForm) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json(updatedForm);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update form' });
  }
});

module.exports = router;
