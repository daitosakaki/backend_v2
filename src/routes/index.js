const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const postRoutes = require('./post.routes');
const chatRoutes = require('./chats.routes');
const messageRoutes = require('./messages.routes');
const followRoutes = require('./follow.routes');
const datingRoutes = require('./dating.routes');

const router = express.Router();

const defaultRoutes = [
  { path: '/auth', route: authRoutes },
  { path: '/dating', route: datingRoutes }, 
  { path: '/user', route: userRoutes },
  { path: '/post', route: postRoutes },
  { path: '/chats', route: chatRoutes },
  { path: '/messages', route: messageRoutes },
  { path: '/follow', route: followRoutes },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;