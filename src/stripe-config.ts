// Stripe product configuration
export const products = [
  {
    id: 'prod_essential',
    name: 'Essential Plan',
    description: 'Complete writing preparation package',
    priceId: 'price_essential_15',
    price: '$15.00',
    interval: 'month',
    mode: 'subscription',
    features: [
      'Access to basic writing tools',
      'Limited AI feedback',
      'Basic text type templates',
      'Email support',
      'Unlimited AI feedback',
      'All text type templates',
      'Unlimited Practice Essays',
      'Advanced writing analysis',
      'Practice exam simulations',
      'Priority support',
      'Progress tracking'
    ],
    popular: true
  }
];

// Helper function to get product by price ID
function getProductByPriceId(priceId: string) {
  return products.find(product => product.priceId === priceId);
}

// Helper function to get product by ID
function getProductById(id: string) {
  return products.find(product => product.id === id);
}