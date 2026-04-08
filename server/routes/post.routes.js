import express from 'express'
import { 
    addPost, 
    toggleLikePost, 
    getFeed, 
    getUserPosts, 
    deletePost 
} from '../controllers/postController.js'
import { upload } from '../configs/multer.js';
import { requireAuth } from '@clerk/express'

const router=express.Router()

router.post(
    '/add',
    requireAuth(),
    upload.array('images',5),addPost)

router.post('/like/:postId',requireAuth(),toggleLikePost)
router.get("/feed", requireAuth(), getFeed);
router.get("/user/:username", requireAuth(), getUserPosts);
router.delete("/:postId", requireAuth(), deletePost);

export default router;