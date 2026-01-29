# Plesk Node.js Configuration Guide

## Step 1: Domain Setup
1. Log into your Plesk panel
2. Go to Websites & Domains
3. Select your domain

## Step 2: Enable Node.js
1. Click on "Node.js" under your domain
2. Enable Node.js support

## Step 3: Configure Application
- **Node.js Version**: 18.x or higher
- **Application Mode**: production
- **Application Root**: /httpdocs/backend (or your backend folder path)
- **Application Startup File**: server.js
- **Document Root**: /httpdocs/frontend/build (for serving React app)

## Step 4: Environment Variables
Add these in Plesk Node.js settings → "Environment variables":

```
NODE_ENV=production
PORT=5000
CUSTOM_DOMAIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
MONGODB_URI=mongodb://localhost:27017/saas_tailor
JWT_SECRET=generate_a_strong_secret_key_here
JWT_EXPIRE=30d
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePassword123!
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
WHATSAPP_SESSION_PATH=./whatsapp-sessions
```

## Step 5: Install Dependencies
In Plesk terminal or SSH:
```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/backend
npm install --production
```

## Step 6: Build Frontend
```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/frontend
npm install
REACT_APP_API_URL=https://yourdomain.com/api npm run build
```

## Step 7: MongoDB Setup
Option A: Local MongoDB
```bash
# Install MongoDB on your server
sudo apt-get install mongodb
sudo systemctl start mongodb
```

Option B: MongoDB Atlas
1. Create account at mongodb.com/atlas
2. Create a free cluster
3. Get connection string
4. Update MONGODB_URI

## Step 8: Nginx/Apache Configuration
For Plesk with Nginx, add to "Additional nginx directives":

```nginx
location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

location /uploads {
    alias /var/www/vhosts/yourdomain.com/httpdocs/backend/uploads;
}
```

## Step 9: Start Application
1. In Plesk Node.js panel, click "NPM Install"
2. Click "Restart App"
3. Check application status is "Running"

## Step 10: SSL Certificate
1. Go to SSL/TLS Certificates
2. Install Let's Encrypt certificate
3. Enable "Redirect HTTP to HTTPS"

## Troubleshooting

### Check Logs
```bash
tail -f /var/www/vhosts/yourdomain.com/logs/error.log
```

### Common Issues

1. **Port already in use**
   - Change PORT in environment variables

2. **MongoDB connection failed**
   - Verify MongoDB is running
   - Check connection string

3. **Permission denied**
   - Ensure uploads folder is writable
   ```bash
   chmod 755 uploads
   ```

4. **WhatsApp not working**
   - WhatsApp Web requires Chromium
   - May need to install additional dependencies
   ```bash
   sudo apt-get install chromium-browser
   ```

## Maintenance

### Backup
```bash
# Database backup
mongodump --db saas_tailor --out /backup/$(date +%Y%m%d)

# Files backup
tar -czf uploads_backup.tar.gz uploads/
```

### Update Application
```bash
git pull
npm install --production
# Restart in Plesk
```
