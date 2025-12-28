# Admin Panel Access Guide

## How to Access the Admin Dashboard

The admin panel can be accessed in two ways:

### Method 1: Direct URL (Recommended)
1. Make sure your server is running (`node server.js`)
2. Navigate to: **`http://localhost:5506/__afraskhan_admin`**
3. Click the **"Enter Admin Dashboard"** button (no password required)
4. You'll be redirected to the admin dashboard

### Method 2: Via Admin Login Page
1. Navigate to: **`http://localhost:5506/__afraskhan_admin`**
2. Click **"Enter Admin Dashboard"** button
3. No password is required - access is granted immediately

### Method 3: Using Keyboard Shortcut (if available)
- On the main site pages, you can use `Ctrl+Alt+A` or call `window.openAdminModal()` from the browser console

## Admin Panel Features

Once you're in the admin dashboard, you can:

- **View Statistics**: See total products, cart items, and events
- **Add Products**: Use the "Add New Product" form to add products to your store
- **View Sales Charts**: See product sales data over the last 7 days
- **Monitor Events**: View recent user events and cart activity
- **Clear Cart**: Clear all items from the shopping cart
- **Manage Events**: Clear event history

## Notes

- **No Password Required**: Password authentication has been disabled for easier access
- **Localhost Only**: The admin panel is only accessible from localhost for security
- **Add Products**: New products are saved to `data/products.json` on the server

## Adding Products

1. Fill in the product form:
   - **Product ID**: Unique numeric identifier (e.g., 008)
   - **Product Name**: Display name for the product
   - **Price**: Price in ₹ (e.g., 999)
   - **Front Image Path**: Path to front image (e.g., `img/product_front.jpg`)
   - **Back Image Path**: Optional back view image
   - **Description**: Product description

2. Click **"Add Product"** to save

3. Products are immediately available and will appear in your shop (when shop page is updated to load from API)

