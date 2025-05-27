import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER || 'patilpratap2905@gmail.com',
    pass: process.env.EMAIL_PASS || '',
  }
});

export const sendEmail = async (emailContent) => {
  try {
    if (!emailContent.to || !emailContent.subject || !emailContent.text) {
      throw new Error("Missing required email fields");
    }

    await transporter.sendMail({
      from: `"App" <${process.env.EMAIL_USER}>`,
      to: emailContent.to,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    });

    console.log("Email sent");
  } catch (error) {
    console.error("Email error:", error);
    throw new Error("Failed to send email");
  }
};