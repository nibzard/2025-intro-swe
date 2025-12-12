# Logo Instructions for Email Template

## Required File
- **Filename**: `logo-email.png`
- **Location**: `/public/logo-email.png`
- **Size**: 64x64 pixels (or 128x128 for retina, scaled down to 64x64 in email)
- **Format**: PNG with transparent background

## Design Specifications
The logo should match the Skripta branding:
- **Colors**: Red (#E03131) and Blue (#0066CC)
- **Style**: Circle with "S" letter, matching the SVG logo in `components/branding/skripta-logo.tsx`
- **Background**: Transparent or white

## How to Create

### Option 1: Export from Figma/Illustrator
1. Open your SVG logo in Figma or Illustrator
2. Select the logo
3. Export as PNG at 2x resolution (128x128px)
4. Save as `logo-email.png`

### Option 2: Convert SVG to PNG Online
1. Go to https://cloudconvert.com/svg-to-png
2. Upload the SVG logo from `/components/branding/skripta-logo.tsx`
3. Set width to 128px, height to 128px
4. Download and rename to `logo-email.png`

### Option 3: Use Screenshot Tool
1. Open the website homepage
2. Take a screenshot of the logo
3. Crop to 64x64 or 128x128 pixels
4. Save as PNG

## Placement
Once created, place the file at:
```
/public/logo-email.png
```

The email template will automatically use this file when sending password reset emails.

## Testing
After adding the file, test by:
1. Requesting a password reset
2. Check the email in Gmail/Outlook
3. Verify the logo appears correctly
