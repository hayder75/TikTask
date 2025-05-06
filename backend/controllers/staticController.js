const termsOfService = (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Terms of Service</title>
      </head>
      <body>
        <h1>Terms of Service</h1>
        <p>Welcome to TikTok Marketing Hub. By using our platform, you agree to the following terms:</p>
        <ul>
          <li>You must be at least 13 years old to use our services.</li>
          <li>Marketers must sign up using their TikTok account for verification.</li>
          <li>Videos submitted for campaigns must be owned by the submitting marketer.</li>
          <li>We reserve the right to terminate accounts for fraudulent activity.</li>
          <li>Your data is handled as per our Privacy Policy.</li>
        </ul>
        <p>Last updated: May 4, 2025</p>
      </body>
      </html>
    `);
  };
  
  const privacyPolicy = (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Privacy Policy</title>
      </head>
      <body>
        <h1>Privacy Policy</h1>
        <p>At TikTok Marketing Hub, we value your privacy. This policy outlines how we handle your data:</p>
        <ul>
          <li>We collect your TikTok username, follower count, and profile link via TikTok OAuth.</li>
          <li>Your data is used to verify your identity and campaign submissions.</li>
          <li>We do not share your data with third parties except as required by law.</li>
          <li>Your TikTok access tokens are securely stored and encrypted.</li>
          <li>Contact us at support@tiktokmarketinghub.com for data requests.</li>
        </ul>
        <p>Last updated: May 4, 2025</p>
      </body>
      </html>
    `);
  };
  
  module.exports = { termsOfService, privacyPolicy };