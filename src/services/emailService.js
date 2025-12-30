const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html = null) => {
  try {
    const smtpHost = process.env.SMTP_HOST || 'relay.enguard.com';
    // Default to port 465 (SSL) for better security and no relay restrictions
    let smtpPort = parseInt(process.env.SMTP_PORT) || 465;
    const smtpUser = process.env.SMTP_USERNAME || 'hupcfl@enguardsmtp.com';
    const smtpPass = process.env.SMTP_PASSWORD || 'ZHW!bqe2fhz.dce2chg';
    const smtpFromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@hupcfl.com';
    const smtpFromName = process.env.SMTP_FROM_NAME || 'Harmony United Psychiatric Care';

    console.log(`Attempting to send email to: ${to}`);
    console.log(`Using SMTP host: ${smtpHost}:${smtpPort}`);
    console.log(`Using SMTP user: ${smtpUser}`);

    // Determine security settings based on port
    // Port 465: SSL (secure: true)
    // Port 587: TLS (secure: false, but requiresTLS: true)
    // Port 25: Can use TLS if enabled (secure: false, but requiresTLS: true)
    const isSecurePort = smtpPort === 465;
    const useTLS = smtpPort === 587 || (smtpPort === 25 && process.env.SMTP_TLS === 'true');
    
    const transporterConfig = {
      host: smtpHost,
      port: smtpPort,
      secure: isSecurePort, // true for 465 (SSL), false for others
      requireTLS: useTLS, // true for 587 and port 25 with TLS
      tls: {
        rejectUnauthorized: false // For self-signed certificates
      }
    };

    // Always use authentication when credentials are available
    // Port 25 with TLS can use authentication
    // Ports 587 and 465 require authentication
    if (smtpUser && smtpPass) {
      transporterConfig.auth = {
        user: smtpUser,
        pass: smtpPass
      };
      console.log('Using SMTP authentication');
      
      if (smtpPort === 465) {
        console.log('Port 465 (SSL) with authentication - allows sending to any domain');
      } else if (smtpPort === 587) {
        console.log('Port 587 (TLS) with authentication - allows sending to any domain');
      } else if (smtpPort === 25 && useTLS) {
        console.log('Port 25 (TLS) with authentication - allows sending to any domain');
      } else if (smtpPort === 25) {
        console.warn('⚠️  Port 25 without TLS has relay restrictions.');
        console.warn('The SMTP server may block recipient domains that are not whitelisted.');
        console.warn('Recommendation: Use port 465 (SSL) or 587 (TLS) with authentication.');
      }
    } else {
      console.warn('⚠️  No SMTP credentials configured. Authentication may fail.');
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

    // Determine the "from" email address
    // For authenticated SMTP (ports 465, 587, or 25 with TLS), we can use any from address
    // But it's good practice to use an address from the same domain as the SMTP user
    let fromEmail = smtpFromEmail;
    
    if (smtpUser && smtpUser.includes('@')) {
      const smtpDomain = smtpUser.split('@')[1];
      const fromDomain = smtpFromEmail.includes('@') ? smtpFromEmail.split('@')[1] : '';
      
      // If domains don't match, optionally use SMTP user email as from address
      // This is optional for authenticated SMTP but can help with deliverability
      if (fromDomain !== smtpDomain && smtpPort === 25 && !useTLS) {
        // Only for port 25 without TLS (relay mode)
        console.log(`Using SMTP user email (${smtpUser}) as from address for port 25 relay mode`);
        fromEmail = smtpUser;
      } else if (fromDomain === smtpDomain) {
        console.log(`From email domain (${fromDomain}) matches SMTP user domain - using ${smtpFromEmail}`);
      } else {
        console.log(`Using configured from email: ${smtpFromEmail} (authenticated SMTP allows this)`);
      }
    }

    const finalFromEmail = fromEmail;
    
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
    const currentPort = parseInt(process.env.SMTP_PORT) || 465;
    const currentUseTLS = currentPort === 587 || (currentPort === 25 && process.env.SMTP_TLS === 'true');
    const currentSmtpUser = process.env.SMTP_USERNAME || 'hupcfl@enguardsmtp.com';
    const currentSmtpPass = process.env.SMTP_PASSWORD;
    const currentSmtpHost = process.env.SMTP_HOST || 'relay.enguard.com';
    
    if (error.code === 'EAUTH' || error.responseCode === 535 || error.message.includes('Authentication failed')) {
      errorMessage = 'SMTP authentication failed. Please check your SMTP_USERNAME and SMTP_PASSWORD in your .env file.';
      if (currentPort === 25 && !currentUseTLS) {
        errorMessage += ' Note: Port 25 without TLS may not support authentication. Try port 465 (SSL) or 587 (TLS).';
      }
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = `Cannot connect to SMTP server at ${currentSmtpHost}:${currentPort}. Please check your SMTP host and port settings.`;
      if (currentPort === 465) {
        errorMessage += ' Make sure SSL is enabled for port 465.';
      } else if (currentPort === 587) {
        errorMessage += ' Make sure TLS is enabled for port 587.';
      }
    } else if (error.responseCode === 550 || error.message.includes('Relay is not allowed') || error.message.includes('relay')) {
      // Check if it's a recipient rejection (RCPT TO command)
      const isRecipientRejection = error.command === 'RCPT TO' || (error.rejected && error.rejected.length > 0);
      
      if (isRecipientRejection) {
        const rejectedRecipients = error.rejected ? error.rejected.join(', ') : 'the recipient';
        
        if (currentPort === 25 && !currentUseTLS && currentSmtpUser && currentSmtpPass) {
          errorMessage = `SMTP relay error (550): Port 25 without TLS has relay restrictions and is blocking the recipient domain.\n\nSOLUTION: Switch to authenticated SMTP by updating your .env file:\n\nSMTP_PORT=465\n\nPort 465 (SSL) with authentication allows sending to any domain. Your credentials are already configured, just change the port.`;
        } else if (currentPort === 25 && !currentUseTLS) {
          errorMessage = `SMTP relay error (550): Port 25 without TLS/authentication has relay restrictions.\n\nSOLUTION: Use port 465 (SSL) or 587 (TLS) with authentication. Update your .env: SMTP_PORT=465`;
        } else {
          errorMessage = `SMTP relay error (550): The SMTP server is blocking the recipient email address (${rejectedRecipients}).\n\nThis is unusual for authenticated SMTP (ports 465/587). Please:\n1. Verify your SMTP credentials are correct\n2. Contact your SMTP administrator\n3. Check if the recipient domain is blocked`;
        }
      } else {
        errorMessage = `SMTP relay error (550): The "from" email address domain must match your SMTP server's authorized domain. Please set SMTP_FROM_EMAIL to an email address from the same domain as your SMTP_USERNAME (${currentSmtpUser}), or configure your SMTP server to allow relay for your domain.`;
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
