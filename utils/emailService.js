import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'patilchetann2905@gmail.com',
    pass: 'ProjectMania@000'
  }
});

export const sendEmail = async (emailContent) => {
  try {
    if (!emailContent.to || !emailContent.subject || !emailContent.text) {
      throw new Error('Missing required email fields');
    }

    await transporter.sendMail({
      from: `"App" <patilpratap2905@gmail.com>`,
      to: emailContent.to,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    });

    console.log('Email sent');
  } catch (error) {
    console.error('Email error:', error);
    throw new Error('Failed to send email');
  }
};