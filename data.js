const COUPONS = {
  SALT10: 0.1,
  WELCOME15: 0.15,
};

function seedProducts() {
  return [
    { id: 1, name: 'Himalayan Pink Salt (Fine)', category: 'Himalayan', price: 6.99, stock: 42, unit: '500g bag', emoji: '🏔️', description: 'Delicately pink, fine-grain salt mined from ancient Himalayan deposits. Great for everyday cooking.' },
    { id: 2, name: 'Himalayan Pink Salt (Coarse)', category: 'Himalayan', price: 7.99, stock: 30, unit: '500g bag', emoji: '🏔️', description: 'Coarse crystals ideal for salt mills and slow-release seasoning.' },
    { id: 3, name: 'Himalayan Salt Block (Cooking Slab)', category: 'Himalayan', price: 24.99, stock: 5, unit: '8x8 in slab', emoji: '🧱', description: 'A solid slab of Himalayan salt for grilling, chilling, and serving.' },
    { id: 4, name: 'French Grey Sea Salt (Sel Gris)', category: 'Sea Salt', price: 9.49, stock: 25, unit: '400g bag', emoji: '🌊', description: 'Hand-harvested from Brittany salt marshes, naturally moist with a mineral-rich flavor.' },
    { id: 5, name: 'Fleur de Sel', category: 'Sea Salt', price: 14.99, stock: 18, unit: '250g tin', emoji: '🌊', description: 'The "flower of salt" — delicate crystals hand-skimmed from the surface of salt ponds.' },
    { id: 6, name: 'Flaky Maldon Sea Salt', category: 'Sea Salt', price: 8.49, stock: 0, unit: '250g box', emoji: '🌊', description: 'Iconic pyramid-shaped flakes, perfect for finishing dishes. Currently out of stock.' },
    { id: 7, name: 'Celtic Sea Salt', category: 'Sea Salt', price: 8.99, stock: 22, unit: '400g bag', emoji: '🌊', description: 'Greyish, moist salt with a briny, mineral taste from the Atlantic coast of France.' },
    { id: 8, name: 'Smoked Applewood Salt', category: 'Gourmet', price: 11.99, stock: 15, unit: '200g jar', emoji: '✨', description: 'Cold-smoked over applewood for a deep, savory finishing salt.' },
    { id: 9, name: 'Black Truffle Salt', category: 'Gourmet', price: 18.99, stock: 3, unit: '150g jar', emoji: '✨', description: 'Sea salt infused with real black truffle. Low stock — a customer favorite.' },
    { id: 10, name: 'Hawaiian Black Lava Salt', category: 'Gourmet', price: 13.49, stock: 12, unit: '200g jar', emoji: '✨', description: 'Sea salt blended with activated charcoal for a bold, earthy crunch.' },
    { id: 11, name: 'Rosemary Garlic Finishing Salt', category: 'Gourmet', price: 10.49, stock: 20, unit: '180g jar', emoji: '✨', description: 'Sea salt blended with dried rosemary and roasted garlic.' },
    { id: 12, name: 'Kosher Salt', category: 'Cooking Basics', price: 3.99, stock: 60, unit: '1kg box', emoji: '🍳', description: 'Coarse, additive-free salt for everyday cooking and brining.' },
    { id: 13, name: 'Iodized Table Salt', category: 'Cooking Basics', price: 2.49, stock: 80, unit: '750g box', emoji: '🍳', description: 'Fine, fortified table salt for the everyday kitchen.' },
    { id: 14, name: 'Pickling & Canning Salt', category: 'Cooking Basics', price: 4.49, stock: 35, unit: '1kg bag', emoji: '🍳', description: 'Pure, fine-grain salt with no anti-caking agents — ideal for pickling brines.' },
    { id: 15, name: 'Lavender Bath Salt Soak', category: 'Spa & Bath', price: 9.99, stock: 27, unit: '500g jar', emoji: '🛁', description: 'Epsom and sea salt blend infused with lavender oil for a relaxing soak.' },
    { id: 16, name: 'Eucalyptus Detox Bath Salt', category: 'Spa & Bath', price: 9.99, stock: 0, unit: '500g jar', emoji: '🛁', description: 'A refreshing eucalyptus and mint bath soak. Currently out of stock.' },
  ];
}

function seedUsers() {
  return [
    { id: 1, name: 'Test User', email: 'test@saltmarket.com', password: 'password123', isAdmin: false },
    { id: 2, name: 'Store Admin', email: 'admin@saltmarket.com', password: 'admin123', isAdmin: true },
  ];
}

module.exports = { COUPONS, seedProducts, seedUsers };
