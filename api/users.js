const { Router } = require("express");

const { Business } = require("../models/business");
const { Photo } = require("../models/photo");
const { Review } = require("../models/review");
const { User } = require("../models/user");
const bcrypt = require("bcrypt");

const router = Router();
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // Set this in your .env for production



function requireAuth(req, res, next) {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid Authorization header" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
// Middleware to require user or admin
function requireUserOrAdmin(req, res, next) {
  const { userId } = req.params;
  if (req.user && (req.user.admin || req.user.id == userId)) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden" });
}
/*
 * Route to create a new user.
 * Only an authenticated admin can create a user with admin: true.
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, password, admin } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    
    let isAdmin = false;
    if (admin === true || admin === "true") {
     
      if (req.user && req.user.admin === true) {
        isAdmin = true;
      } else {
        return res.status(403).json({ error: "Only admins can create admin users." });
      }
    }

    const user = await User.create({ name, email, password, admin: isAdmin });
    res.status(201).json({ id: user.id });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Email already in use.' });
    } else {
      res.status(500).json({ error: 'Failed to create user.' });
    }
  }
});


// POST /users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password." });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    // Create JWT payload
    const payload = {
      id: user.id,
      admin: user.admin
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: "Failed to log in." });
  }
});

// GET /users/:userId (exclude password)
router.get('/:userId', requireAuth,requireUserOrAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user." });
  }
});
/*
 * Route to list all of a user's businesses.
 */
router.get("/:userId/businesses", requireAuth,requireUserOrAdmin, async function (req, res) {
  const userId = req.params.userId;
  const userBusinesses = await Business.findAll({ where: { ownerId: userId } });
  res.status(200).json({
    businesses: userBusinesses,
  });
});

/*
 * Route to list all of a user's reviews.
 */
router.get("/:userId/reviews", requireAuth,requireUserOrAdmin, async function (req, res) {
  const userId = req.params.userId;
  const userReviews = await Review.findAll({ where: { userId: userId } });
  res.status(200).json({
    reviews: userReviews,
  });
});

/*
 * Route to list all of a user's photos.
 */
router.get("/:userId/photos", requireAuth,requireUserOrAdmin, async function (req, res) {
  const userId = req.params.userId;
  const userPhotos = await Photo.findAll({ where: { userId: userId } });
  res.status(200).json({
    photos: userPhotos,
  });
});

module.exports = router;