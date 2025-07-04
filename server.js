import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authMiddleware from './authMiddleware.js'; // Import the authentication middleware
import User from './user.js'; // Import the User model
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3000;
const SECRET_KEY = "secret";

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cookieParser());




const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI is not defined in the environment variables.");
        process.exit(1); // Exit the application
    }

    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
          
        });
        console.log(`MONGODB CONNECTED !! ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Connection error:", error);
        process.exit(1); // Exit the application on error
    }
};

connectDB();
// Sample data
let data = [
    { username: 'user1', courses: 'Math, Science', year: 2021, fee: 5000, session: "2021-2024" },
    { username: 'user2', courses: 'History, Arts', year: 2022, fee: 4500, session: "2021-2024" },
    { username: 'user3', courses: 'Physics, Chemistry', year: 2023, fee: 6000, session: "2021-2024" }
];

// Routes
app.get('/', (req, res) => {
    res.render('index', { title: 'Welcome' });
});

app.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sign Up' });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ msg: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Error creating user' });
    }
});

app.get('/admin', async (req, res) => {
    try {
        const users = await User.find();
        res.render('admindashboard', { users, errors: {}, formData: {} });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'An error occurred while fetching users.',
            error,
        });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ msg: 'Please provide both username and password' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' });
        console.log("Token generated:", token);

        res.cookie('access_token', token, {
            httpOnly: true,
            maxAge: 3 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        return res.status(200).json(token);
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/profile', authMiddleware, async (req, res) => {
    try {
        console.log("verified>>>", req.user);
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        console.log("user>>", user);
        res.render("profile", { user: user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/add', async (req, res) => {
    const { username, courses, year, fee, session } = req.body;
    let errors = {};

    if (!username) errors.username = "Username is required";
    if (!courses) errors.courses = "Courses are required";
    if (!year) errors.year = "Year is required";
    if (!fee) errors.fee = "Fee is required";
    if (!session) errors.session = "Session is required";

    if (Object.keys(errors).length > 0) {
        const users = await User.find();
        return res.render('admindashboard', { users, errors, formData: req.body });
    }

    try {
        const newUser = new User({ username, courses, year: parseInt(year), fee: parseInt(fee), session });
        await newUser.save();
        // Redirect after successful add
        res.redirect('/thanku');
    } catch (err) {
        if (err.code === 11000) {
            errors.username = "Username already exists";
            const users = await User.find();
            return res.render('admindashboard', { users, errors, formData: req.body });
        }
        res.status(500).json("internal server error");
    }
});

app.put('/update', async (req, res) => {

    // console.log("req", req);
    console.log("req body", req.body);
    const {id, username, courses, year, fee,session} = req.body;
//    const id = req.body.id;
   
    try {
        // Update user in the database
        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                username,
                courses,
                year: parseInt(year, 10), // Ensure year is an integer
                fee: parseInt(fee, 10),   // Ensure fee is an integer
                session,
            },
            { new: true } // Return the updated document
        );

        // Check if user exists
        if (!updatedUser) {
            return res.status(404).send('User not found.');
        }

        console.log("Updated user:", updatedUser);

        // Respond with the updated user
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send('Error updating user.');
    }
});

// Route for thank you page
app.get('/thanku', (req, res) => {
    res.render('ThankYou', { title: 'Thank You' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
