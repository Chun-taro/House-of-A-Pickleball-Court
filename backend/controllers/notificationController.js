import Notification from '../models/Notification.js';

// Get Notifications for Current Logged-in User (Customer or Admin/Staff)
export const getNotifications = async (req, res) => {
  try {
    const isAdminOrStaff = ['admin', 'staff'].includes(req.user.role);

    const query = isAdminOrStaff
      ? {
          $or: [
            { user_id: req.user._id },
            { for_role: { $in: ['admin', 'staff', 'all_admin'] } },
          ],
        }
      : {
          user_id: req.user._id,
        };

    const notifications = await Notification.find(query)
      .populate('booking_id', 'booking_code status total_amount paid_amount start_time end_time booking_date')
      .populate('user_id', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(35);

    // Map unread status for admin/staff vs customer
    const mapped = notifications.map((n) => {
      const isReadByMe = n.is_read || (n.read_by && n.read_by.some((uId) => uId.toString() === req.user._id.toString()));
      return {
        ...n.toObject(),
        is_read: isReadByMe,
      };
    });

    const unreadCount = mapped.filter((n) => !n.is_read).length;

    return res.json({
      success: true,
      unread_count: unreadCount,
      notifications: mapped,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Mark Single or All Notifications as Read
export const markNotificationsAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdminOrStaff = ['admin', 'staff'].includes(req.user.role);

    if (id === 'read-all') {
      if (isAdminOrStaff) {
        await Notification.updateMany(
          { for_role: { $in: ['admin', 'staff', 'all_admin'] } },
          { $addToSet: { read_by: req.user._id }, is_read: true }
        );
      } else {
        await Notification.updateMany({ user_id: req.user._id, is_read: false }, { is_read: true });
      }
      return res.json({ success: true, message: 'All notifications marked as read.' });
    }

    const notif = await Notification.findById(id);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (isAdminOrStaff) {
      if (!notif.read_by.some((uId) => uId.toString() === req.user._id.toString())) {
        notif.read_by.push(req.user._id);
      }
      notif.is_read = true;
    } else {
      notif.is_read = true;
    }
    await notif.save();

    return res.json({ success: true, message: 'Notification marked as read.', notification: notif });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a Notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.deleteOne({ _id: id });
    return res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
