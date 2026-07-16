import Directive from '../models/Directive.js';
import { updateOverdueStatuses } from './dashboardController.js';

// Create a new directive (can be assigned to multiple users)
export const createDirective = async (req, res) => {
  try {
    const {
      subject,
      startDate,
      endDate,
      userIds,
      priority,
      directiveType,
      ministerRef,
      directiveDate,
      durationDays,
      details
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'At least one user must be selected.' });
    }

    // Set first message as the directive details
    const messages = [];
    if (details && details.trim()) {
      messages.push({
        sender: req.user._id,
        message: details,
        createdAt: new Date()
      });
    }

    const directives = [];
    for (const uid of userIds) {
      const newDirective = new Directive({
        subject,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
        status: 'In Process',
        user: uid,
        priority: priority || 'medium',
        directiveType: directiveType || 'minister',
        ministerRef,
        directiveDate: directiveDate ? new Date(directiveDate) : undefined,
        durationDays,
        details,
        messages
      });
      await newDirective.save();
      directives.push(newDirective);
    }

    res.status(201).json({ message: 'Directives created successfully', directives });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get pending directives (In Process / Overdue)
export const getPendingDirectives = async (req, res) => {
  try {
    await updateOverdueStatuses();
    const filter = { status: { $in: ['In Process', 'Overdue'] } };
    if (req.user.role === 'User') {
      filter.user = req.user._id;
    }
    const directives = await Directive.find(filter)
      .populate('user')
      .populate({ path: 'messages.sender', select: 'name designation role' });
    
    res.json(directives);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Endorse a directive (complete status)
export const endorseDirective = async (req, res) => {
  try {
    const { id } = req.params;
    const directive = await Directive.findByIdAndUpdate(
      id,
      { status: 'Completed', closedAt: new Date() },
      { new: true }
    );

    if (!directive) {
      return res.status(404).json({ error: 'Directive not found' });
    }

    res.json(directive);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get closed directives (Completed)
export const getClosedDirectives = async (req, res) => {
  try {
    const filter = { status: 'Completed' };
    if (req.user.role === 'User') {
      filter.user = req.user._id;
    }
    const directives = await Directive.find(filter)
      .populate('user')
      .populate({ path: 'messages.sender', select: 'name designation role' });
    
    res.json(directives);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reply to a directive thread
export const replyToDirective = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const directive = await Directive.findById(id);
    if (!directive) {
      return res.status(404).json({ error: 'Directive not found' });
    }

    directive.messages.push({
      sender: req.user._id,
      message: message || '',
      createdAt: new Date()
    });

    await directive.save();

    const populated = await Directive.findById(id)
      .populate('user')
      .populate({ path: 'messages.sender', select: 'name designation role' });

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
