import nodemailer from "nodemailer";

export const transport = nodemailer.createTransport({
    from : `AI Inventory Management System <nelsonprox92@gmail.com>`,
    auth : {
        user : "nelsonprox92@gmail.com",
        pass : ""
    }
})