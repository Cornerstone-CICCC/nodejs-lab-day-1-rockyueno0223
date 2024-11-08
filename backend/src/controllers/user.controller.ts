import { Request, Response } from 'express'
import userModel from '../models/user.model'
import { User } from '../types/user'
import { compareHash, hashed } from '../utils/hash.util'

// Get users
const getUsers = (req: Request, res: Response) => {
  const users = userModel.findAll()
  res.json(users)
}

// Get user by id
const getUserById = (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params
  const user = userModel.findById(id)
  if (!user) {
    res.status(404).send('User not found')
    return
  }
  res.json(user)
}

// Add user
const addUser = async (req: Request<{}, {}, User>, res: Response) => {
  const { username, password, firstname, lastname } = req.body
  const hashedPassword = await hashed(password)
  const user = userModel.createUser({ username, password: hashedPassword, firstname, lastname })

  if (user) {
    res.cookie('isAuthenticated', true, {
      httpOnly: true,
      maxAge: 3 * 60 * 1000,
      signed: true,
    });
    res.cookie('userId', user.id, {
      httpOnly: true,
      maxAge: 3 * 60 * 1000,
      signed: true,
    });
    res.status(201).json({ user, success: true });
  }
}

// Update user by id
const updateUserById = (req: Request<{ id: string }, {}, User>, res: Response) => {
  const { id } = req.params
  const { username, firstname, lastname } = req.body
  const user = userModel.editUser(id, { username, firstname, lastname })
  if (!user) {
    res.status(404).json({ message: "User not found" })
    return
  }
  res.status(200).json(user)
}

// Delete user by id
const deleteUserById = (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params
  const isDeleted = userModel.deleteUser(id)
  if (!isDeleted) {
    res.status(404).send('User not found')
    return
  }
  res.status(200).send('User deleted!')
}

// Login user
const loginUser = async (req: Request<{}, {}, User>, res: Response) => {
  const { username, password } = req.body
  const user = userModel.findByUsername(username)
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }
  const isMatch = await compareHash(password, user.password)
  if (!isMatch) {
    res.status(401).json({ message: 'Password is invalid '})
    return
  }
  res.cookie('isAuthenticated', true, {
    httpOnly: true,
    maxAge: 3 * 60 * 1000,
    signed: true
  })
  res.cookie('userId', user.id, {
    httpOnly: true,
    maxAge: 3 * 60 * 1000,
    signed: true
  })
  res.status(200).json({ user, success: true, message: 'Login authenticated' })
}

// Logout user
const logoutUser = async (req: Request<{}, {}, User>, res: Response) => {
  res.clearCookie('isAuthenticated', {
    httpOnly: true,
    signed: true
  });
  res.clearCookie('userId', {
    httpOnly: true,
    signed: true
  });

  res.status(200).json({ message: 'User logged out successfully' });
}

// Check auth profile
const userProfile = (req: Request, res: Response) => {
  res.status(200).send('You are allowed to view the page')
}

//Get user by user id
const getUserProfile = (req: Request, res: Response) => {
  const { username } = req.params;
  const user = userModel.findByUsername(username);

  if (user) {
    res.status(200).json({ username: user.username, firstname: user.firstname, lastname: user.lastname });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

export default {
  getUsers,
  getUserById,
  addUser,
  updateUserById,
  deleteUserById,
  loginUser,
  logoutUser,
  userProfile,
  getUserProfile
}
