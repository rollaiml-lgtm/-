
(() => {
  const message = document.getElementById('sellerMessage');
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const loginForm = document.getElementById('loginForm');
  const productForm = document.getElementById('productForm');
  const productList = document.getElementById('sellerProducts');
  const addButton = document.getElementById('addProductButton');

  let db;

  // Display success and error messages
  function say(text, error = false) {
    message.textContent = text;
    message.classList.toggle('error', error);
  }

  // Check Supabase configuration
  function configured() {
    return (
      window.SUPABASE_URL &&
      window.SUPABASE_PUBLISHABLE_KEY &&
      !window.SUPABASE_URL.includes('PASTE_') &&
      !window.SUPABASE_PUBLISHABLE_KEY.includes('PASTE_')
    );
  }

  if (
    !configured() ||
    !window.supabase ||
    !message ||
    !loginSection ||
    !dashboardSection ||
    !loginForm ||
    !productForm ||
    !productList ||
    !addButton
  ) {
    console.error('Supabase configuration or required HTML elements are missing.');

    if (message) {
      say(
        'Setup error: check supabase-config.js and the seller dashboard HTML.',
        true
      );
    }

    return;
  }

  // Create Supabase client
  db = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_PUBLISHABLE_KEY
  );

  // -----------------------------
  // LOGIN
  // -----------------------------
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;

    if (!email || !password) {
      say('Please enter your email and password.', true);
      return;
    }

    const loginButton = loginForm.querySelector('button');
    if (loginButton) loginButton.disabled = true;

    say('Signing in...');

    try {
      const { error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      await refreshSession();
      say('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      say('Login failed: ' + error.message, true);
    } finally {
      if (loginButton) loginButton.disabled = false;
    }
  });

  // -----------------------------
  // LOGOUT
  // -----------------------------
  const logoutButton = document.getElementById('logoutButton');

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      say('Logging out...');

      const { error } = await db.auth.signOut();

      if (error) {
        say('Logout failed: ' + error.message, true);
        return;
      }

      await refreshSession();
      say('You have logged out.');
    });
  }

  // -----------------------------
  // AUTHENTICATION STATE
  // -----------------------------
  db.auth.onAuthStateChange(() => {
    setTimeout(() => {
      refreshSession();
    }, 0);
  });

  async function refreshSession() {
    const { data, error } = await db.auth.getSession();

    if (error) {
      say('Could not check login status: ' + error.message, true);
      return;
    }

    const session = data.session;

    loginSection.hidden = !!session;
    dashboardSection.hidden = !session;

    if (session) {
      const signedInAs = document.getElementById('signedInAs');

      if (signedInAs) {
        signedInAs.textContent = 'Signed in as ' + session.user.email;
      }

      await loadSellerProducts();
    } else {
      productList.replaceChildren();
    }
  }

  // -----------------------------
  // ADD / UPLOAD PRODUCT
  // -----------------------------
  productForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fileInput = document.getElementById('productPhoto');
    const file = fileInput?.files?.[0];

    if (!file) {
      say('Please select a product photo.', true);
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      say('Choose a JPG, PNG, or WebP image.', true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      say('The photo must be 5 MB or smaller.', true);
      return;
    }

    const name = document.getElementById('productName')?.value.trim();
    const price = Number(
      document.getElementById('productPrice')?.value
    );

    if (!name) {
      say('Please enter the product name.', true);
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      say('Please enter a valid product price.', true);
      return;
    }

    addButton.disabled = true;

    let uploadedPath = null;

    try {
      // Confirm the current Supabase user
      say('Checking login...');

      const {
        data: { user },
        error: userError
      } = await db.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error('Please sign in again before uploading.');
      }

      // Create a unique path inside this seller's folder
      const extension =
        file.name.split('.').pop().toLowerCase()
          .replace(/[^a-z0-9]/g, '') || 'jpg';

      uploadedPath =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

      // Upload image to Supabase Storage
      say('Uploading photo...');

      const { data: uploadedFile, error: uploadError } =
        await db.storage
          .from('product-images')
          .upload(uploadedPath, file, {
            upsert: false,
            contentType: file.type
          });

      if (uploadError) {
        throw new Error('Image upload failed: ' + uploadError.message);
      }

      // Obtain public URL for the uploaded image
      const { data: publicData } = db.storage
        .from('product-images')
        .getPublicUrl(uploadedFile.path);

      const imageUrl = publicData.publicUrl;

      // Save product details in the database
      say('Saving product details...');

      const { error: insertError } = await db
        .from('products')
        .insert({
          seller_id: user.id,
          name: name,
          price: price,
          category:
            document.getElementById('productCategory')?.value || null,
          description:
            document.getElementById('productDescription')?.value.trim() || null,
          image_url: imageUrl
        });

      if (insertError) {
        throw new Error(
          'Product database error: ' + insertError.message
        );
      }

      productForm.reset();

      say('Product published successfully!');

      await loadSellerProducts();

    } catch (error) {
      console.error('Product publishing error:', error);

      // Remove the uploaded image if saving the product failed
      if (uploadedPath) {
        const { error: cleanupError } = await db.storage
          .from('product-images')
          .remove([uploadedPath]);

        if (cleanupError) {
          console.error('Image cleanup error:', cleanupError);
        }
      }

      say(error.message || 'Something went wrong.', true);

    } finally {
      addButton.disabled = false;
    }
  });

  // -----------------------------
  // LOAD PRODUCTS
  // -----------------------------
  async function loadSellerProducts() {
    productList.replaceChildren();

    const { data, error } = await db
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Product loading error:', error);
      say('Could not load products: ' + error.message, true);
      return;
    }

    if (!data || data.length === 0) {
      productList.textContent =
        'No products have been uploaded yet.';
      return;
    }

    data.forEach((product) => {
      const row = document.createElement('article');
      row.className = 'seller-product';

      // Product image
      const img = document.createElement('img');
      img.src = product.image_url || '';
      img.alt = product.name || 'Product image';
      img.loading = 'lazy';

      // Product information
      const info = document.createElement('div');

      const title = document.createElement('h3');
      title.textContent = product.name;

      const price = document.createElement('p');
      price.textContent =
        '₹' + Number(product.price).toLocaleString('en-IN');

      info.append(title, price);

      if (product.category) {
        const category = document.createElement('p');
        category.textContent = 'Category: ' + product.category;
        info.appendChild(category);
      }

      // Delete button
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'delete-product';
      del.textContent = 'Delete';

      del.addEventListener('click', async () => {
        const confirmed = confirm(
          `Delete "${product.name}" from the shop?`
        );

        if (!confirmed) return;

        del.disabled = true;

        try {
          // Delete only the selected database record
          const { error: deleteError } = await db
            .from('products')
            .delete()
            .eq('id', product.id)
            .eq('seller_id', product.seller_id);

          if (deleteError) throw deleteError;

          // Extract the Storage path from this seller's public URL
          if (product.image_url) {
            try {
              const imageUrl = new URL(product.image_url);
              const marker = '/storage/v1/object/public/product-images/';
              const index = imageUrl.pathname.indexOf(marker);

              if (index !== -1) {
                const imagePath = decodeURIComponent(
                  imageUrl.pathname.slice(index + marker.length)
                );

                const { error: removeError } = await db.storage
                  .from('product-images')
                  .remove([imagePath]);

                if (removeError) {
                  console.warn('Image was not removed:', removeError.message);
                }
              }
            } catch (imageError) {
              console.warn('Could not remove product image:', imageError);
            }
          }

          say('Product deleted successfully.');
          await loadSellerProducts();

        } catch (error) {
          console.error('Delete error:', error);
          say('Could not delete product: ' + error.message, true);
          del.disabled = false;
        }
      });

      row.append(img, info, del);
      productList.appendChild(row);
    });
  }

  // -----------------------------
  // INITIALIZE DASHBOARD
  // -----------------------------
  refreshSession().catch((error) => {
    console.error('Dashboard initialization error:', error);
    say('Could not initialize dashboard: ' + error.message, true);
  });
})();
