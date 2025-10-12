import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host : process.env.EMAIL_HOST,
    port : 587,
    secure : false,
    from : `Inventrika ${process.env.EMAIL_FROM}`,
    auth : {
        user : process.env.EMAIL_USER,
        pass : process.env.EMAIL_USER_PASS
    }
});

export default transporter