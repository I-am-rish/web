const nodeMailer = require("nodemailer");

const sendEmail = async ({ email, subject, message }) => {
  let transporter = nodeMailer.createTransport({
    // host: "smtp.gmail.com",
    service: process.env.SMTP_SERVICE,
    // port: 587,
    // secure: false, // upgrade later with STARTTLS
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // tls: {
    //   rejectUnauthorized: false,
    // },
  });

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    text: message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
