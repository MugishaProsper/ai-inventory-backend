import transporter from "../config/email.config";

export const sendVerificationToken = async (email, token) => {
    try {
        const response = await transporter.sendMail({
            from : process.env.EMAIL_FROM,
            to : email,
            subject : "Verification Email",
            text : `Click on the following link to verify your account ${process.env.CLIENT_URL}/verify/${token}`
        })
        return response.accepted.length > 0;
    } catch (error) {
        throw new Error("Failed to send verification token");
    }
};

export const sendVerificationCode = async (email, code) => {
    try {
        const response = await transporter.sendMail({
            from : process.env.EMAIL_FROM,
            to : email,
            subject : "Verification Code",
            text : `Your verification code is ${code} \n \n This code will expire in 5 minutes`
        })
        return response.accepted.length > 0;
    } catch (error) {
        throw new Error("Failed to send verification code");
    }
};

export const sendResetPassword = async (email, token) => {
    try {
        const response = await transporter.sendMail({
            from : process.env.EMAIL_FROM,
            to : email,
            subject : "Reset Password",
            text : `Click on the following link to reset your password ${process.env.CLIENT_URL}/reset-password/${token}`
        })
        return response.accepted.length > 0;
    } catch (error) {
        throw new Error("Failed to send reset password");
    }
};