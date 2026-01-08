const Activity = require('../models/Activity');
const User = require('../models/User');

// Helper funkcija za kreiranje aktivnosti
const createActivityHelper = async (userId, type, data, visibility = 'public') => {
  try {
    const activity = new Activity({
      user: userId,
      type,
      data,
      visibility
    });
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Create activity helper error:', error);
    throw error; // Baci grešku dalje
  }
};

// Dohvati activity feed
exports.getActivityFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, limit = 50, page = 1 } = req.query;
    
    const skip = (page - 1) * limit;

    // Dohvati prijatelje korisnika
    const user = await User.findById(userId).select('friends');
    const friendIds = user.friends || [];

    // Query za feed - prikaži public aktivnosti + aktivnosti prijatelja
    const query = {
      $or: [
        { visibility: 'public' },
        { user: userId }, // Vlastite aktivnosti
        { user: { $in: friendIds }, visibility: { $in: ['public', 'friends'] } } // Prijateljeve aktivnosti
      ]
    };

    if (type) {
      query.type = type;
    }

    const activities = await Activity.find(query)
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Total count za pagination
    const total = await Activity.countDocuments(query);

    res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati aktivnosti korisnika
exports.getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const activities = await Activity.find({ user: userId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(activities);
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Kreiraj aktivnost (za testiranje ili ručno dodavanje)
exports.createActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, data, visibility } = req.body;

    if (!type || !data) {
      return res.status(400).json({ message: 'Type i data su obavezni!' });
    }

    const activity = await createActivityHelper(userId, type, data, visibility);

    await activity.populate('user', 'username avatar');

    res.status(201).json({ 
      message: 'Aktivnost kreirana!', 
      activity 
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Obriši aktivnost
exports.deleteActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user.id;

    const activity = await Activity.findById(activityId);
    
    if (!activity) {
      return res.status(404).json({ message: 'Aktivnost ne postoji' });
    }

    // Samo vlasnik može obrisati
    if (activity.user.toString() !== userId) {
      return res.status(403).json({ message: 'Nemaš pravo obrisati ovu aktivnost!' });
    }

    await Activity.findByIdAndDelete(activityId);

    res.json({ message: 'Aktivnost obrisana!' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ ISPRAVLJENI EXPORT
exports.createActivityHelper = createActivityHelper;