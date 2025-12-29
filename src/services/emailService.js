const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html = null) => {
  try {
    const smtpHost = process.env.SMTP_HOST || 'relay.enguard.com';
    const smtpPort = parseInt(process.env.SMTP_PORT) || 25;
    const smtpUser = process.env.SMTP_USERNAME || 'hupcfl@enguardsmtp.com';
    const smtpPass = process.env.SMTP_PASSWORD || 'ZHW!bqe2fhz.dce2chg';
    const smtpFromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@hupcfl.com';
    const smtpFromName = process.env.SMTP_FROM_NAME || 'Harmony United Psychiatric Care';

    console.log(`Attempting to send email to: ${to}`);
    console.log(`Using SMTP host: ${smtpHost}:${smtpPort}`);
    console.log(`Using SMTP user: ${smtpUser}`);

    // For port 25, many SMTP servers don't support authentication (relay servers)
    // Port 25 typically has strict relay restrictions and doesn't support auth
    // Ports 587/465 with authentication typically allow relay to any domain
    const needsAuth = smtpPort !== 25 && smtpUser && smtpPass;
    
    const transporterConfig = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      tls: {
        rejectUnauthorized: false // For self-signed certificates
      }
    };

    // Only add authentication for ports that support it (587, 465, etc.)
    // Port 25 typically doesn't support authentication
    if (needsAuth) {
      transporterConfig.auth = {
        user: smtpUser,
        pass: smtpPass
      };
      console.log('Using SMTP authentication');
    } else if (smtpPort === 25) {
      console.log('Port 25 detected - using relay mode (no authentication)');
      console.warn('WARNING: Port 25 without authentication has relay restrictions.');
      console.warn('The SMTP server may block recipient domains that are not whitelisted.');
      console.warn('To send to any domain, use port 587 or 465 with authentication.');
    } else {
      console.log('No authentication configured');
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    // Verify connection (optional - some SMTP servers don't support verification)
    try {
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Verification timeout')), 5000))
      ]);
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.warn('SMTP verification failed or timed out, but continuing anyway:', verifyError.message);
      // Don't throw - some SMTP servers don't support verify() but can still send emails
    }

    // Ensure the "from" email matches the SMTP user domain to avoid relay restrictions
    // For port 25 (relay servers), the "from" address MUST match the authorized domain
    // Always use SMTP user email for port 25 to ensure it matches the authorized domain
    let fromEmail = smtpFromEmail;
    
    if (smtpPort === 25 && smtpUser && smtpUser.includes('@')) {
      // For port 25, always use SMTP user email to avoid relay restrictions
      console.log(`Port 25 detected - using SMTP user email (${smtpUser}) as from address to avoid relay restrictions`);
      fromEmail = smtpUser;
    } else if (smtpUser && smtpUser.includes('@')) {
      // For other ports, check if domains match
      const smtpDomain = smtpUser.split('@')[1];
      const fromDomain = smtpFromEmail.includes('@') ? smtpFromEmail.split('@')[1] : '';
      
      // If domains don't match, use SMTP user email as from address
      if (fromDomain !== smtpDomain) {
        console.warn(`From email domain (${fromDomain}) doesn't match SMTP user domain (${smtpDomain}). Using SMTP user email (${smtpUser}) as from address to avoid relay restrictions.`);
        fromEmail = smtpUser;
      } else {
        console.log(`From email domain (${fromDomain}) matches SMTP user domain - using ${smtpFromEmail}`);
      }
    }

    // For port 25, ensure we're using the SMTP user email to avoid relay restrictions
    // Some SMTP servers check both envelope sender and From header
    const finalFromEmail = (smtpPort === 25 && smtpUser) ? smtpUser : fromEmail;
    
    const mailOptions = {
      from: `"${smtpFromName}" <${finalFromEmail}>`,
      to,
      subject,
      text,
      ...(html && { html })
    };

    console.log(`=== EMAIL CONFIGURATION ===`);
    console.log(`SMTP Port: ${smtpPort}`);
    console.log(`SMTP User: ${smtpUser}`);
    console.log(`Original From Email: ${smtpFromEmail}`);
    console.log(`Final From Email: ${finalFromEmail}`);
    console.log(`Sending email from: ${finalFromEmail} to: ${to}`);
    console.log(`===========================`);

    console.log(`Sending email with subject: ${subject}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.code === 'EAUTH' || error.responseCode === 535 || error.message.includes('Authentication failed')) {
      if (smtpPort === 25) {
        errorMessage = 'SMTP authentication failed on port 25. Port 25 typically does not support authentication. Please use port 587 (TLS) or 465 (SSL) with authentication to send emails to any domain. Update your .env file: SMTP_PORT=587 or SMTP_PORT=465';
      } else {
        errorMessage = 'SMTP authentication failed. Please check your SMTP_USERNAME and SMTP_PASSWORD in your .env file.';
      }
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = `Cannot connect to SMTP server at ${process.env.SMTP_HOST || 'relay.enguard.com'}:${process.env.SMTP_PORT || 25}. Please check your SMTP host and port settings.`;
    } else if (error.responseCode === 550 || error.message.includes('Relay is not allowed') || error.message.includes('relay')) {
      // Check if it's a recipient rejection (RCPT TO command)
      const isRecipientRejection = error.command === 'RCPT TO' || (error.rejected && error.rejected.length > 0);
      
      if (isRecipientRejection) {
        const rejectedRecipients = error.rejected ? error.rejected.join(', ') : 'the recipient';
        errorMessage = `SMTP relay error (550): The SMTP server is blocking the recipient email address (${rejectedRecipients}). The recipient's domain is not authorized for relay on this SMTP server. Please contact your SMTP administrator to allow relay for the recipient's domain, or use a different SMTP server that allows sending to this domain.`;
      } else {
        const smtpUserForError = process.env.SMTP_USERNAME || 'hupcfl@enguardsmtp.com';
        errorMessage = `SMTP relay error (550): The "from" email address domain must match your SMTP server's authorized domain. Please set SMTP_FROM_EMAIL to an email address from the same domain as your SMTP_USERNAME (${smtpUserForError}), or configure your SMTP server to allow relay for your domain.`;
      }
    } else if (error.responseCode) {
      errorMessage = `SMTP server error (${error.responseCode}): ${error.response || error.message}`;
    }
    
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.code = error.code;
    enhancedError.responseCode = error.responseCode;
    throw enhancedError;
  }
};

module.exports = {
  sendEmail
};
