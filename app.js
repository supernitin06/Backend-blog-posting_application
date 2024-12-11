const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const crypto = require('crypto');
const users = require('./models/user'); // Ensure this model exists and is correct
const posts = require('./models/posts'); // Ensure this model exists and is correct

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('signup');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/upload', islogin, (req, res) => {
    res.render('upload');
});

app.get('/logout', (req, res) => {
    res.cookie('token', "", { maxAge: 0 }); // Clear the token cookie
    res.redirect('/login');
});

app.get('/profile', islogin, async (req, res) => {
    try {
        const user = await users.findOne({ email: req.user.email }).populate('posts');
        res.render("profile", { user });
    } catch (error) {
        res.status(500).send("Error loading profile");
    }
});

app.get('/like/:id', islogin, async (req, res) => {
    try {
        const post = await posts.findOne({ _id: req.params.id }).populate('user');
        if (!post.users.includes(req.user._id)) {
            post.users.push(req.user._id);
            await post.save();
        }
        res.redirect("/profile");
    } catch (error) {
        res.status(500).send("Error liking post");
    }
});

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/upload'); // Ensure this folder exists
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(12, function (err, buffer) {
            if (err) return cb(err); // Handle error properly
            const uniqueSuffix = buffer.toString('hex');
            cb(null, file.fieldname + '-' + uniqueSuffix + '-' + Date.now() + '-' + file.originalname);
        });
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single("image"), async (req, res) => {
    try {
        console.log(req.body);
        res.send("File uploaded successfully!");
    } catch (error) {
        res.status(500).send("Error uploading file");
    }
});

app.post('/post', islogin, async (req, res) => {
    try {
        const user = await users.findOne({ email: req.user.email });
        const { content } = req.body;

        const post = await posts.create({
            user: user._id,
            content
        });

        user.posts.push(post._id);
        await user.save();
        res.redirect('/profile');
    } catch (error) {
        res.status(500).send("Error creating post");
    }
});

app.post('/register', async (req, res) => {
    try {
        const { name, username, email, password, age } = req.body;
        const user = await users.findOne({ email });

        if (user) return res.status(400).send("USERNAME ALREADY REGISTERED");

        const hash = await bcrypt.hash(password, 10);

        const newUser = await users.create({
            name,
            username,
            password: hash,
            email,
            age,
        });

        const token = jwt.sign({ email: newUser.email, userid: newUser.id }, "shhhh");
        res.cookie('token', token, { httpOnly: true });
        res.send("register");
    } catch (error) {
        res.status(500).send("Error registering user");
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await users.findOne({ email });

        if (!user) return res.status(400).send("Not registered email");

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.redirect('/login');
        }

        const token = jwt.sign({ email: user.email, userid: user.id }, "shhhh");
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/profile');
    } catch (error) {
        res.status(500).send("Error logging in");
    }
});

// Middleware to check login
function islogin(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send("Login first");
    }

    try {
        const data = jwt.verify(token, "shhhh");
        req.user = data;
        next();
    } catch (error) {
        res.status(401).send("Invalid or expired token");
    }
}

// Start server
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
