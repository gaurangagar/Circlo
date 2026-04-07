import express from 'express'
import { 
    syncUser,
    getCurrentUser,
    updateUserData,
    discoverUser, 
    followUser,
    unfollowUser, 
    sendConnectionRequest, 
    getUserConnections, 
    acceptConnectionRequest,
    getUserProfiles,
    getPendingRequests,   
} from '../controllers/userController.js';
import { upload } from '../configs/multer.js';
import { requireAuth } from '@clerk/express'

const router = express.Router();

// Sync Clerk user → DB
router.post("/sync", requireAuth(), syncUser);

// Get current logged-in user
router.get("/me", requireAuth(), getCurrentUser);

// Update profile
router.put("/update", requireAuth(), updateUserData);

// Discover users
router.get("/discover", requireAuth(), discoverUser);

// Get user profile by username
router.get("/profile/:username", requireAuth(), getUserProfiles);

// Upload profile picture
router.put(
  "/profile-picture",
  requireAuth(),
  upload.single("image"),
  updateProfilePicture
);


/* =========================
   FOLLOW SYSTEM
========================= */

router.post("/follow", requireAuth(), followUser);
router.post("/unfollow", requireAuth(), unfollowUser);


/* =========================
   CONNECTION SYSTEM
========================= */

// Send request
router.post("/connect", requireAuth(), sendConnectionRequest);

// Accept request
router.post("/connect/accept", requireAuth(), acceptConnectionRequest);

// Get all connections
router.get("/connections", requireAuth(), getUserConnections);

// Get pending requests
router.get("/connections/pending", requireAuth(), getPendingRequests);


export default router;