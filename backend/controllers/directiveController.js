const DirectiveThread = require("../models/DirectiveThread");
const User = require("../models/User");
const emailer = require("../email");

// Format date like: 5th Jan, 2026 at 1:01 PM
function formatDate(d) {
  if (!d) d = new Date();
  const date = new Date(d);
  const day = date.getDate();
  const year = date.getFullYear();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  // ordinal
  let ord = 'th';
  if (!(day % 100 >= 11 && day % 100 <= 13)) {
    if (day % 10 === 1) ord = 'st';
    else if (day % 10 === 2) ord = 'nd';
    else if (day % 10 === 3) ord = 'rd';
  }
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;
  return `${day}${ord} ${month}, ${year} at ${hours}:${minutes} ${ampm}`;
}

// Create a new directive thread
exports.createDirective = async (req, res) => {
  try {
    const { subject, priority, duration, members, message, type, meetingReference, meetingDate, ministerReference, directiveDate } = req.body;
        const ministerId = req.user._id;

        // Handle attachments (if any)
        let attachments = [];
        if (req.files && req.files.length > 0) {
            attachments = req.files.map((file) => ({
                filename: file.originalname,
                url: `/uploads/directives/${file.filename}`,
                mimetype: file.mimetype,
                size: file.size,
            }));
        }

        // Parse duration if it's a JSON string
        let parsedDuration = duration;
        if (typeof duration === "string") {
            try {
                parsedDuration = JSON.parse(duration);
            } catch (e) {
                parsedDuration = duration;
            }
        }

        // Parse members
        let parsedMembers = [];
        if (typeof members === "string") {
            parsedMembers = [members];
        } else if (Array.isArray(members)) {
            parsedMembers = members;
        }

        // Build message array (only if message or attachments exist)
        let messageArray = [];
        if ((message && message.trim() !== "") || attachments.length > 0) {
            messageArray.push({
                sender: ministerId,
                message: message || "", // fallback to empty string
                attachments,
            });
        }

        const ministerUser = await User.findById(ministerId);
        // Create a thread for each member
        const threads = await Promise.all(
          parsedMembers.map(async (memberId) => {
                const threadData = {
                  subject,
                  priority,
                  duration: parsedDuration,
                  minister: ministerId,
                  members: [memberId],
                  status: "pending",
                  memberViewed: false,
                  messages: messageArray,
                  newMessageCount: {},
                  type: type || "Minister Directive",
                };
                if (type === "Meeting Directive") {
                  if (meetingReference) threadData.meetingReference = meetingReference;
                  if (meetingDate) threadData.meetingDate = new Date(meetingDate);
                } else {
                  if (ministerReference) threadData.ministerReference = ministerReference;
                  if (directiveDate) threadData.directiveDate = new Date(directiveDate);
                }
                const thread = new DirectiveThread(threadData);
                await thread.save();

                // Update user notification flag
                await User.findByIdAndUpdate(memberId, {
                    $set: { hasNewRemarks: true },
                });

                // Send notification email to member (non-blocking)
                try {
                  const memberUser = await User.findById(memberId);
                  if (memberUser) {
                    console.log(`Directive: preparing email for member ${memberId} - email=${memberUser.email || 'NO_EMAIL'}`);
                    if (memberUser.email) {
                      const username = memberUser.email
                        ? memberUser.email.split('@')[0]
                        : (memberUser.name || 'User');
                        const createdAtFormatted = formatDate(thread.createdAt || new Date());
                      const mailText = `Dear ${username} (${memberUser.name}),\nA new directive, "${subject}" has been issued to you by ${ministerUser && ministerUser.name ? ministerUser.name : 'Management'} at "${createdAtFormatted}" on "Executive Performance Management System". Please view your account for details.`;
                      const mailHtml = `<p>Dear ${username} (${memberUser.name}),</p><p>A new directive, "<strong>${subject}</strong>" has been issued to you by <strong>${ministerUser && ministerUser.name ? ministerUser.name : 'Management'}</strong> on "<strong>${createdAtFormatted}</strong>" "Executive Performance Management Dashboard". Please view your account for details.</p>`;
                      emailer.sendMail({ to: memberUser.email, subject: `New Directive: ${subject}`, text: mailText, html: mailHtml }).catch((err) => console.error('Email send error', err));
                    }
                  }
                } catch (e) {
                  console.error('Failed preparing/sending directive email', e);
                }

                return thread;
            })
        );

        // Populate references
        const populatedThreads = await DirectiveThread.find({
            _id: { $in: threads.map((t) => t._id) },
        })
            .populate({ path: "messages.sender", select: "name designation" })
            .populate({ path: "minister", select: "name designation" })
            .populate({ path: "members", select: "name designation email _id" });

        res.status(201).json(populatedThreads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get threads by status and user (minister or member)
exports.getThreads = async (req, res) => {
  try {
    const { status, userType } = req.query;
    const userId = req.user._id;
    let filter = {};
    if (userType === "minister") {
      // Only allow access to directives for users with the SAME designation as the logged-in user
      const currentUser = await User.findById(userId);
      if (!currentUser || !currentUser.designation) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      // Find all users with the same designation (case-insensitive)
      const sameDesignationUsers = await User.find(
        { designation: { $regex: new RegExp(`^${currentUser.designation}$`, 'i') } },
        "_id"
      );
      const sameDesignationIds = sameDesignationUsers.map((u) => u._id);
      filter.minister = { $in: sameDesignationIds };
    }
    if (userType === "member") filter.members = userId; // changed from member to members
    if (status === "new") {
      filter.memberViewed = false;
      filter.status = "pending";
    } else if (status) {
      filter.status = status;
    }
    // Populate members and messages.sender with full user objects
    const threads = await DirectiveThread.find(filter)
      .populate({ path: "minister", select: "name designation" })
      .populate({
        path: "members",
        select: "name designation designation email _id",
      })
      .populate({ path: "messages.sender", select: "name designation" })
      .sort({ updatedAt: -1 });
    // Attach newMessageCount as plain object for each thread
    const threadsWithCounts = threads.map((thread) => {
      const t = thread.toObject();
      t.newMessageCount =
        thread.newMessageCount &&
        typeof thread.newMessageCount.entries === "function"
          ? Object.fromEntries(thread.newMessageCount.entries())
          : thread.newMessageCount
          ? thread.newMessageCount
          : {};
      return t;
    });
    res.json(threadsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get threads for a specific user (for minister's view)
exports.getUserThreads = async (req, res) => {
  try {
    const { userId, status } = req.query;
    const threads = await DirectiveThread.find({ members: userId, status }) // changed from member to members
      .populate("minister", "name designation")
      .populate("members", "name designation") // changed from member to members
      .populate({ path: "messages.sender", select: "name designation" })
      .sort({ updatedAt: -1 });
    // Attach newMessageCount as plain object for each thread
    const threadsWithCounts = threads.map((thread) => {
      const t = thread.toObject();
      t.newMessageCount =
        thread.newMessageCount &&
        typeof thread.newMessageCount.entries === "function"
          ? Object.fromEntries(thread.newMessageCount.entries())
          : thread.newMessageCount
          ? thread.newMessageCount
          : {};
      return t;
    });
    res.json(threadsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get threads for a specific user
exports.getLoggedInUserThreads = async (req, res) => {
  try {
    const userType = req?.user?.role; // 'minister' or 'member'
    const userId = req?.user?._id;
    let filter = {};

    if (!userType || !userId) {
      return res.status(400).json({ error: "Invalid user type or user ID" });
    }

    if (userType === "minister") filter.minister = userId;
    if (userType === "member") filter.members = userId; //

    const threads = await DirectiveThread.find(filter)
      .populate({ path: "minister", select: "name designation" })
      .populate({ path: "members", select: "name designation email _id" })
      .populate({ path: "messages.sender", select: "name designation" })
      .sort({ updatedAt: -1 });

    // Attach newMessageCount as plain object for each thread
    const threadsWithCounts = threads.map((thread) => {
      const t = thread.toObject();
      t.newMessageCount =
        thread.newMessageCount &&
        typeof thread.newMessageCount.entries === "function"
          ? Object.fromEntries(thread.newMessageCount.entries())
          : thread.newMessageCount
          ? thread.newMessageCount
          : {};
      return t;
    });
    res.json(threadsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a reply to a thread
exports.replyToThread = async (req, res) => {
  try {
    const { threadId, message } = req.body;
    const senderId = req.user._id;
    // Handle attachments (if any)
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map((file) => ({
        filename: file.originalname,
        url: `/uploads/directives/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
      }));
    }
    const thread = await DirectiveThread.findById(threadId);
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    thread.messages.push({ sender: senderId, message, attachments }); // Store sender as ObjectId
    thread.status = thread.status === "new" ? "pending" : thread.status;
    // Get sender and minister
    const sender = await User.findById(senderId);
    const ministerId = thread.minister.toString();
    if (sender && sender.role === "Management") {
      // Minister is replying: clear all newMessageCount for this thread
      thread.newMessageCount = {};
      thread.memberViewed = false; // Mark as not viewed by member
      await User.updateMany(
        { _id: { $in: thread.members } },
        { $set: { hasNewRemarks: true } }
      );
    } else {
      // Member is replying: increment newMessageCount for minister
      // Ensure newMessageCount is a Map
      if (
        thread.newMessageCount &&
        typeof thread.newMessageCount.set === "function"
      ) {
        // Mongoose Map
        const current = thread.newMessageCount.get(ministerId) || 0;
        thread.newMessageCount.set(ministerId, current + 1);
        thread.markModified("newMessageCount");
      } else {
        // Plain object (legacy or initial)
        if (
          !thread.newMessageCount ||
          typeof thread.newMessageCount !== "object"
        ) {
          thread.newMessageCount = {};
        }
        thread.newMessageCount[ministerId] =
          (thread.newMessageCount[ministerId] || 0) + 1;
        thread.markModified("newMessageCount");
      }
    }
    await thread.save();
    // Populate sender for each message
    const populatedThread = await DirectiveThread.findById(threadId)
      .populate({ path: "messages.sender", select: "name designation" })
      .populate({ path: "minister", select: "name designation" })
      .populate({ path: "members", select: "name designation email _id" });
    
    res.json(populatedThread);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Endorse (close) a thread
exports.endorseThread = async (req, res) => {
  try {
    const { threadId } = req.body;
    const thread = await DirectiveThread.findById(threadId);
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    thread.status = "closed";
    thread.closedAt = new Date(); // Set closedAt to current date/time
    await thread.save();
    // Populate sender for each message and members/minister for frontend
    const populatedThread = await DirectiveThread.findById(threadId)
      .populate({ path: "messages.sender", select: "name designation" })
      .populate({ path: "minister", select: "name designation" })
      .populate({ path: "members", select: "name designation email _id" });
    // Send endorsement emails to members when a thread is endorsed
    try {
      const subject = populatedThread.subject || '';
      const endorsedAt = formatDate(thread.closedAt || new Date());
      if (populatedThread.members && populatedThread.members.length > 0) {
        console.log(`Endorse: sending emails for thread ${threadId} to ${populatedThread.members.length} members`);
        populatedThread.members.forEach((member) => {
          if (member && member.email) {
            const username = member.email ? member.email.split('@')[0] : (member.name || 'User');
            const mailText = `Dear ${username} (${member.name}),\nYour directive on "Executive Performance Management System", "${subject}" has been endorsed at ${endorsedAt}. Please view your account.`;
            const mailHtml = `<p>Dear ${username} (${member.name}),</p><p>Your directive, "<strong>${subject}</strong>" has been endorsed at <strong>${endorsedAt}</strong>. Please view your account.</p>`;
            emailer.sendMail({ to: member.email, subject: `Directive Endorsed: ${subject}`, text: mailText, html: mailHtml }).catch((err) => console.error('Email send error', err));
          } else {
            console.log(`Endorse: member ${member && member._id} has no email, skipping`);
          }
        });
      }
    } catch (e) {
      console.error('Failed to send endorsement emails', e);
    }

    res.json(populatedThread);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get thread history/messages
exports.getThreadHistory = async (req, res) => {
  try {
    const { threadId } = req.query;
    const thread = await DirectiveThread.findById(threadId)
      .populate("messages.sender", "name designation")
      .populate("minister", "name designation")
      .populate("members", "name designation"); // changed from member to members
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    res.json(thread);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add endpoint to mark thread as viewed by member or management
exports.markThreadViewed = async (req, res) => {
  try {
    const { userId } = req.body; // userId is the member whose threads are being viewed by the minister
    const ministerId = req.user._id.toString();
    // Find all threads between this minister and the selected user
    const threads = await DirectiveThread.find({
      minister: ministerId,
      members: userId,
    });
    for (const thread of threads) {
      thread.memberViewed = true; // Always mark as viewed (NOTE: this is not per-minister-member pair)
      if (
        thread.newMessageCount &&
        typeof thread.newMessageCount.set === "function"
      ) {
        thread.newMessageCount.delete(ministerId); // Remove the key entirely for robust notification logic
        thread.markModified("newMessageCount");
      } else if (
        thread.newMessageCount &&
        thread.newMessageCount[ministerId] !== undefined
      ) {
        delete thread.newMessageCount[ministerId];
        thread.markModified("newMessageCount");
      }
      await thread.save();
      // Log after save
      const savedThread = await DirectiveThread.findById(thread._id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Close a directive thread
exports.closeDirective = async (req, res) => {
  try {
    const { threadId } = req.body;
    if (!threadId)
      return res.status(400).json({ error: "threadId is required" });
    const thread = await DirectiveThread.findById(threadId);
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    thread.status = "closed";
    thread.closedAt = new Date();
    await thread.save();
    // Populate to get member emails and subject
    const populatedThread = await DirectiveThread.findById(threadId)
      .populate({ path: "messages.sender", select: "name designation" })
      .populate({ path: "minister", select: "name designation" })
      .populate({ path: "members", select: "name designation email _id" });

    // Send endorsement emails to members (non-blocking)
    try {
      const subject = populatedThread.subject || '';
      const endorsedAt = formatDate(thread.closedAt || new Date());
      if (populatedThread.members && populatedThread.members.length > 0) {
        console.log(`CloseDirective: sending endorsement emails for thread ${threadId} to ${populatedThread.members.length} members`);
        populatedThread.members.forEach((member) => {
          if (member && member.email) {
            const username = member.email ? member.email.split('@')[0] : (member.name || 'User');
            const mailText = `Dear ${username} (${member.name}),\nYour directive, "${subject}" has been endorsed at ${endorsedAt}. Please view your account.`;
            const mailHtml = `<p>Dear ${username} (${member.name}),</p><p>Your directive, "<strong>${subject}</strong>" has been endorsed at <strong>${endorsedAt}</strong>. Please view your account.</p>`;
            emailer.sendMail({ to: member.email, subject: `Directive Endorsed: ${subject}`, text: mailText, html: mailHtml }).catch((err) => console.error('Email send error', err));
          } else {
            console.log(`CloseDirective: member ${member && member._id} has no email, skipping`);
          }
        });
      }
    } catch (e) {
      console.error('Failed to send endorsement emails', e);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
