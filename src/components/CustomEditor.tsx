---
// src/pages/editor.astro
import CustomEditor from '../components/CustomEditor';
import '../styles/global.css';
import '../styles/editor.css';

export const prerender = false;
---

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>&FRIENDS Studio - Editor</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE/Edge */
            font-family: 'JetBrains Mono', monospace;
        }
        
        *::-webkit-scrollbar {
            display: none; /* Chrome/Safari/Opera */
            width: 0;
            height: 0;
        }
        
        html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        
        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
            display: none;
        }
    </style>
</head>
<body>
    <CustomEditor client:only="react" />
</body>
</html>
```

---

## Now let's set up Google OAuth! 🔐

### Step 1: Google Cloud Console Setup

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Go to **APIs & Services** → **OAuth consent screen**
   - Choose **External** (unless you have a Google Workspace)
   - App name: `&FRIENDS Studio Editor`
   - User support email: your email
   - Developer contact: your email
   - Click **Save and Continue**
   - Skip scopes (just click **Save and Continue**)
   - Add test users (your email) if in testing mode
   - Click **Save and Continue**

4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `&FRIENDS Editor`
   - Authorized JavaScript origins:
```
     http://localhost:4321
     https://andfriendsstudio.vercel.app
```
   - Authorized redirect URIs:
```
     http://localhost:4321/api/auth/google/callback
     https://andfriendsstudio.vercel.app/api/auth/google/callback