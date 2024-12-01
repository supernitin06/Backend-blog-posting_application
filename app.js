const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(express.json());
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const users = require('./models/user');
const posts = require('./models/post');


app.get('/', (req, res) => {
    res.render('signup');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/logout', (req, res) => {
    res.cookie('token', "", { maxAge: 0 }); // Clear the token cookie
    res.redirect('/login');
});
app.get('/profile', islogin, async (req, res) => {
    
        const user = await users.findOne({ email: req.user.email }).populate('posts')
  
        res.render("profile", { user }); 
  
});
app.get('/like/:id', islogin, async (req, res) => {
    
        const post = await posts.findOne({ _id: req.params.id }).populate('user')
        post.users.push(req.user._id);
        res.redirect("profile"); 
  
});
app.post('/post', islogin, async (req, res) => {
    const user = await users.findOne({ email: req.user.email }); // Use await for asynchronous calls
    let { content } = req.body;

    let post = await posts.create({
        user: user._id,
        content 
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect('/profile');
});



app.post('/register', async (req, res) => {
    const { name, username, email, password, age } = req.body;

    const user = await users.findOne({ email });

    if (user) return res.status(500).send("USERNAME ALREADY REGISTERED");

    const gensalt = 10;
    bcrypt.hash(password, gensalt, async (err, hash) => {
        if (err) return res.status(500).send("Error in hashing password");

        const newUser = await users.create({
            name,
            username,
            password: hash,
            email,
            age,
        });

        const token = jwt.sign({ email: newUser.email, userid: newUser.id }, "shhhh");
        res.cookie('token', token, { httpOnly: true }); // Set the cookie properly
        res.send("register");
    });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await users.findOne({ email });

    if (!user) return res.status(400).send("Not registered email");

    bcrypt.compare(password, user.password, (err, result) => {
        if (err || !result) {
            return res.redirect('/login');
        }

        const token = jwt.sign({ email: user.email, userid: user.id }, "shhhh");
        res.cookie('token', token, { httpOnly: true }); // Set the cookie on login
        res.redirect('/profile');
    });
});


function islogin(req, res, next) {
    const token = req.cookies.token; // Use req.cookies to access the token
    if (!token) { // Check if the token is missing or empty
        return res.status(404).send("Login first");
    }

    try {
        const data = jwt.verify(token, "shhhh"); // Verify the token
        req.user = data; // Attach decoded data to the request object
        next(); // Proceed to the next middleware or route
    } catch (error) {
        res.status(401).send("Invalid or expired token"); // Handle invalid token cases
    }
}

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});


