const Notification = require('../models/Notification');

// Helper funkcija za kreiranje notifikacije
const createNotificationHelper = async (recipientId, type, title, message, link = null, data = {}, senderId = null) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      link,
      data
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Create notification helper error:', error);
    throw error; // Baci grešku dalje
  }
};

// Dohvati sve notifikacije korisnika
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unreadOnly, limit = 50 } = req.query;

    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Count unread
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Označi notifikaciju kao pročitanu
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notifikacija ne postoji' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ message: 'Notifikacija označena kao pročitana' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Označi sve notifikacije kao pročitane
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { 
        $set: { 
          read: true, 
          readAt: new Date() 
        } 
      }
    );

    res.json({ message: 'Sve notifikacije označene kao pročitane' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Obriši notifikaciju
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notifikacija ne postoji' });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.json({ message: 'Notifikacija obrisana' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Obriši sve notifikacije
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.deleteMany({ recipient: userId });

    res.json({ message: 'Sve notifikacije obrisane' });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ ISPRAVLJENI EXPORT
exports.createNotificationHelper = createNotificationHelper;