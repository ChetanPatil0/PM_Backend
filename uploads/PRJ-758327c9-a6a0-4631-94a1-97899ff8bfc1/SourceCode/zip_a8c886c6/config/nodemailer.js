import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: 'patilpratap2905@gmail.com',
    pass: process.env.EMAIL_PASS,
  },
});

export default transporter;