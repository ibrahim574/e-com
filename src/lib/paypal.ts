import {
  Client,
  Environment,
  OrdersController,
  CheckoutPaymentIntent,
  OrderApplicationContextLandingPage,
  OrderApplicationContextUserAction,
} from "@paypal/paypal-server-sdk";

function getPayPalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are not configured");
  }

  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: clientId,
      oAuthClientSecret: clientSecret,
    },
    environment:
      process.env.PAYPAL_MODE === "live"
        ? Environment.Production
        : Environment.Sandbox,
  });
}

export async function createPayPalOrder(params: {
  totalCents: number;
  currency: "CAD" | "USD";
  orderNumber: string;
}) {
  const client = getPayPalClient();
  const ordersController = new OrdersController(client);

  const amount = (params.totalCents / 100).toFixed(2);

  const response = await ordersController.createOrder({
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          referenceId: params.orderNumber,
          amount: {
            currencyCode: params.currency,
            value: amount,
          },
        },
      ],
      applicationContext: {
        brandName: "Hytera Radios",
        landingPage: OrderApplicationContextLandingPage.NoPreference,
        userAction: OrderApplicationContextUserAction.PayNow,
      },
    },
  });

  const orderId = response.result.id;
  if (!orderId) {
    throw new Error("Failed to create PayPal order");
  }

  return orderId;
}

export async function capturePayPalOrder(paypalOrderId: string) {
  const client = getPayPalClient();
  const ordersController = new OrdersController(client);

  const response = await ordersController.captureOrder({
    id: paypalOrderId,
    body: {},
  });

  const captureId =
    response.result.purchaseUnits?.[0]?.payments?.captures?.[0]?.id ?? null;

  return {
    status: response.result.status,
    captureId,
  };
}
