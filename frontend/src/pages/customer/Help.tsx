export default function Help() {
  const steps = [
    ['Pick your bag', 'Add it to your cart and go to checkout.'],
    ['Choose your mobile money', 'Select MTN, Telecel or AirtelTigo. We then show the number and account name to pay.'],
    ['Send the exact total', 'Pay the total shown at checkout from your phone.'],
    ['Upload your screenshot', 'Add a screenshot of the confirmation message and press “I have paid”.'],
    ['We confirm and ship', 'We match your payment to our records. You get an inbox message when it is confirmed, or if something needs fixing.'],
  ];
  return (
    <div className="mx-auto max-w-2xl px-5 pt-12 md:px-8">
      <h1 className="font-display text-4xl md:text-5xl">Help</h1>
      <h2 className="mt-12 font-display text-2xl">How to pay</h2>
      <ol className="mt-6 list-decimal space-y-5 pl-5 marker:text-accent">
        {steps.map(([t, d]) => <li key={t}><strong className="font-medium">{t}.</strong> <span className="text-muted">{d}</span></li>)}
      </ol>
      <h2 className="mt-12 font-display text-2xl">Payment not accepted?</h2>
      <p className="mt-3 leading-relaxed text-muted">If we cannot verify a payment, for example the amount is wrong or the screenshot is unreadable, we tell you why in your inbox so you can send the proof again. Your bags stay reserved for 24 hours. You can send new proof from the Orders page, and if nothing arrives in that time the order is cancelled so the bags can go to someone else.</p>
      <h2 className="mt-12 font-display text-2xl">Questions</h2>
      <p className="mt-3 leading-relaxed text-muted">Sign in and send us a message from your inbox. We reply there.</p>
    </div>
  );
}
