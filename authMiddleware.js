import jwt from'jsonwebtoken';
const SECRET_KEY = "secret";

const authMiddleware = (req, res, next) => {
    // const token = req.header('auth-token');
    const token = req.cookies?.access_token; // Using optional chaining

    console.log("token>>>>", token);
    if (!token) return res.status(401).send('Access Denied');

    try {
        const verified = jwt.verify(token, SECRET_KEY);
        console.log("verified:", verified);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
};

if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not defined in the environment variables.");
    process.exit(1); // Exit the application
}

export default authMiddleware;
