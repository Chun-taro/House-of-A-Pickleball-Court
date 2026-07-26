import User from '../models/User.js';

// Admin: Get all users
export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    const usersList = await User.find(query).select('-password').sort({ createdAt: -1 });
    const users = usersList.map((u) => ({ ...u.toObject(), id: u._id, _id: u._id }));
    return res.json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Create user (Customer, Staff, Admin)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email address is already in use.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: role || 'customer',
      is_verified: true,
    });

    const mapped = { ...user.toObject(), id: user._id, _id: user._id };
    delete mapped.password;

    return res.status(201).json({ success: true, message: 'User created successfully', user: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update user role / details
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (password) user.password = password;

    await user.save();

    const mapped = { ...user.toObject(), id: user._id, _id: user._id };
    delete mapped.password;

    return res.json({ success: true, message: 'User updated successfully', user: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete user
export const deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'User account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
