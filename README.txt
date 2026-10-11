HANDMADE HAVEN — WEBSITE WITH SUPABASE PRODUCT UPLOADS

FILES
- index.html / style.css: public storefront and existing design
- script.js: reads products from Supabase and renders them in the Shop section
- seller.html / seller.js: private seller login, upload, list and delete products
- supabase-config.js: your Supabase Project URL and publishable key
- setup.sql: database, image bucket and access policies

IMPORTANT
The website will NOT be fully connected until you configure Supabase using the steps below.

SETUP (ONE TIME)
1. Create a project at https://supabase.com/dashboard
2. In Authentication > Users, create the client's seller account. Do not enable open public sign-up.
3. Copy the client's User UID from Authentication > Users.
4. Open setup.sql and replace every YOUR-CLIENT-USER-UUID with that exact UID. Keep the single quotes around the UUID. Run the edited SQL in Supabase SQL Editor.
5. Open Project Settings / API Keys and copy the Project URL and publishable (or anon) key.
6. Open supabase-config.js and replace the two PASTE_... placeholders. Use only the publishable/anon key in browser code. NEVER use a service_role or secret key in this folder.
7. Upload all files to your GitHub repository, keeping them in the same folder as index.html. Commit the changes and wait for GitHub Pages to deploy.
8. Test the public shop and https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/seller.html . Sign in using the seller account.

HOW CLIENT USES IT
1. Open the website and tap Seller Login, or open seller.html directly.
2. Sign in with the account you created.
3. Enter product name, price, category, description, and choose a JPG/PNG/WebP photo (max 5 MB).
4. Tap Upload and publish product. The item is saved online and should appear in the public shop on all devices.

SECURITY NOTES
- The public key is intended for browser use; Row Level Security and Storage policies protect data.
- Never put a Supabase secret/service_role key in frontend files.
- The SQL policies restrict product changes and uploads to the one user UID you configured.
- Public product photos are viewable by anyone with their URL; this is expected for a public shop.
- Use HTTPS (GitHub Pages does this) and give the client a strong unique password.
- The dashboard uses email/password sign-in. Password resets can be configured through Supabase Auth settings.

CURRENT BEHAVIOUR
- If Supabase has not been configured yet, the public shop shows the sample products from the original demo.
- Once configured, the Shop uses the shared Supabase products instead of the sample list.
- This version supports adding and deleting products. Editing product details can be added later.
