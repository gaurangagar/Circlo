import express from 'express'
import { sseController, getChatMessages, sendMessage } from '../controllers/message.controllers.js';
import upload from '../config/multer.js'
import { requireAuth } from '@clerk/express'

const messageRouter=express.Router();

messageRouter.get('/sse/:userId',requireAuth(),sseController)
messageRouter.post('/post',upload.single('image'),requireAuth(),sendMessage)
messageRouter.post('/get', requireAuth(),getChatMessages)
messageRouter.post("/send", requireAuth(), upload.single("image"), sendMessage);


export default messageRouter;