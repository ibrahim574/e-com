import { getFreeShippingMessage } from "@/lib/shipping";

export default async function ShippingPage() {
  const freeShippingMessage = await getFreeShippingMessage();

  return (
    <div className="container-page py-10">
      <h1 className="section-title">Shipping Policy</h1>
      <div className="mt-8 max-w-2xl prose-store space-y-4">
        <p>
          We ship to the United States and Canada. Orders are processed within 1-2
          business days from our fulfillment center.
        </p>
        {freeShippingMessage && <p>{freeShippingMessage}</p>}
        <p>
          Standard shipping typically arrives within 3-7 business days depending on
          your location. Tracking information is provided once your order ships.
        </p>
      </div>
    </div>
  );
}
