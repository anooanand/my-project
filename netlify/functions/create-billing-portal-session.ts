import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { customerId, returnUrl } = JSON.parse(event.body || '{}');

    if (!customerId || !returnUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing customerId or returnUrl' }),
      };
    }

    // Create a session for the customer portal
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };

  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create billing portal session' }),
    };
  }
};

export { handler };
