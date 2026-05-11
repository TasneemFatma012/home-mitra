# TODO

- [ ] Remove unused/incorrect receipt route file `routes/receipt.js` (since app already serves receipt via `routes/payment.js` at `/payment/receipt/:id`).
- [ ] (Optional) Make `routes/receipt.js` redirect to `/payment/receipt/:id` if we later decide to support legacy `/receipt/:id`.
- [ ] Restart server and verify Razorpay success redirects to `/payment/receipt/:id` and renders `views/payment/receipt.ejs`.

