const Notification = require('../models/Notification');
const User = require('../models/User');

exports.sendNotification = async (userId, type, content, targetId = null, targetType = null) => {
  const user = await User.findById(userId);
  if (!user || !user.notifications?.[type]) return;

  await Notification.create({ user: userId, type, content, targetId, targetType });
};
