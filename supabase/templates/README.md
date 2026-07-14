# PropPost signup email

`confirmation.html` is the **Confirm signup** template for both account types. It uses the `role` value already included in Supabase user metadata to render either the Agency or Agent version.

## Hosted Supabase setup

1. Open the Supabase project dashboard.
2. Go to **Authentication → Email → Templates → Confirm signup**.
3. Set the subject to `Confirm your PropPost account`.
4. Paste the full contents of `confirmation.html` into the message body and save.
5. Under **Authentication → Email → SMTP Settings**, configure Resend as the SMTP provider:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: the Resend API key
   - Sender name: `PropPost`
   - Sender email: an address on the verified sending domain
6. In Resend, disable click tracking for authentication emails so the confirmation URL is not rewritten.

Supabase renders the template and confirmation URL; Resend delivers the resulting email. A Resend-hosted template ID cannot be selected by Supabase's SMTP signup flow.

## Template data

The app supplies these values during `supabase.auth.signUp`:

- Agency: `role`, `agencyName`, and the signup email.
- Agent: `role`, `fullName`, and the signup email.

The header logo is loaded from `{{ .SiteURL }}/proppost-logo-mobile.png`. Ensure the Supabase **Site URL** points to the deployed PropPost site and that this public asset is available there before sending a test.

Use Supabase's built-in test message or sign up with one account of each type after publishing the template.
