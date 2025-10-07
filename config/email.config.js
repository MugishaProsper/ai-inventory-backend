import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    from : `AI Inventory Management System <nelsonprox92@gmail.com>`,
    auth : {
        user : process.env.EMAIL_USER,
        pass : process.env.EMAIL_USER_PASS
    }
});

export default transporter