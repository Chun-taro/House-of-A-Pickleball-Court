import bcrypt from 'bcryptjs';
import db from '../config/db.js';

// Admin: Get all users
export const getUsers = (req, res) => {
  try {
    const { role } = req.query;

    let sql = 'SELECT id, name, email, phone, role, created_at FROM users';
    const params = [];

    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }

    sql += ' ORDER BY id DESC';

    const usersList = db.prepare(sql).all(...params);
    const users = usersList.map(u => ({ ...u, _id: u.id }));
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

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email address is already in use.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const info = db.prepare(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email.toLowerCase(), hashedPassword, phone || '', role || 'customer');

    const userId = Number(info.lastInsertRowid);
    const user = db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(userId);
    return res.status(201).json({ success: true, message: 'User created successfully', user: { ...user, _id: user.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update user role / details
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let sql = 'UPDATE users SET name = ?, email = ?, phone = ?, role = ?';
    const params = [name || user.name, email || user.email, phone !== undefined ? phone : user.phone, role || user.role];

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      sql += ', password = ?';
      params.push(hashedPassword);
    }

    sql += ' WHERE id = ?';
    params.push(req.params.id);

    db.prepare(sql).run(...params);

    const updatedUser = db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(req.params.id);

    return res.json({ success: true, message: 'User updated successfully', user: { ...updatedUser, _id: updatedUser.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete user
export const deleteUser = (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    return res.json({ success: true, message: 'User account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
