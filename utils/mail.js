
const nodemailer = require('nodemailer')

    
exports.mailTransport = () => nodemailer.createTransport({
    service: 'gmail',
    port: 2525,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    }
});
 
exports.generatePasswordResetTemplate = (url) => {
    return `
    <!DOCTYPE html>
    <html lang='en'>
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <style>
            /* Add your custom styles here */
        </style>
    </head>
    <body>
        <div>
            <div>
                <h1>Password Reset</h1>
                <p>You have requested a password reset. Click the link below to reset your password:</p>
                <a href="${url}" target="_blank">Reset Password</a>
            </div>
        </div>
    </body>
    </html>
    `;
};
