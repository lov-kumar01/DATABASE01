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


// import jwt from 'jsonwebtoken';
// const SECRET_KEY = process.env.SECRET_KEY;

// const authMiddleware = (req, res, next) => {
//     const token = req.header('auth-token');
//     if (!token) {
//         console.log('No token provided'); // Debug log
//         return res.status(401).send('Access Denied');
//     }
//       console.log ('Token received', Token);
//     try {
//         const verified = jwt.verify(token, SECRET_KEY);
//         req.user = verified;
//         console.log('Token verified:', verified); // Debug log
//         next();
//     } catch (err) {
//         console.log('Invalid token'); // Debug log
//         res.status(400).send('Invalid Token');
//     }
// };

export default authMiddleware;
