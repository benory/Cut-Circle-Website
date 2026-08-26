# Cut Circle website forms

The Subscribe modal and Contact page share one Cloudflare Worker. The Worker
validates Cloudflare Turnstile server-side, validates the submitted fields, and
then records the response in one Google Form. A Google Apps Script trigger on
the linked response spreadsheet emails each response to the configured
notification recipient.

## 1. Create the Google Form

Create a form called **Cut Circle website forms** with these question titles,
spelled exactly as shown:

1. Category
2. Name
3. First name
4. Last name
5. Email
6. Message
7. Source page
8. User agent

The Worker enforces the required fields for each category, so leave the Google
Form questions optional. `Name` and `Message` are used only by Contact;
`First name` and `Last name` are used only by Subscribe. Link the form to a
response spreadsheet from the Form's **Responses** tab. Make `Email` a normal
short-answer question and leave the Form's separate **Collect email addresses**
setting off.

Use **More → Get pre-filled link**, enter recognizable sample values in every
question, and generate the link. Its query parameters expose each question's
`entry.*` ID. Change the link's final `viewform` segment to `formResponse` for
the post URL. Add the resulting post URL and entry IDs as plain-text variables
in the Cloudflare Worker dashboard. Keep the private Turnstile key in an
encrypted Worker secret.

## 2. Enable email notifications

In the linked response spreadsheet, open **Extensions → Apps Script**. Replace
the editor contents with `google-apps-script.gs`, save, and run
`installFormSubmitTrigger` once. Approve the requested email and spreadsheet
permissions. During testing, notifications are sent only to
`benjaminory@gmail.com`; replying to a notification addresses the visitor.
When testing is complete, change `NOTIFICATION_RECIPIENT` in the script to
`info@cutcircle.org` and save the project.

The notification code relies on the exact question titles listed above.

## 3. Configure Turnstile

Create a Turnstile widget in Cloudflare and allow these production hostnames:

- `cutcircle.org`
- `www.cutcircle.org`
- `benory.github.io` while the GitHub Pages preview remains in use

Keep the secret key in the Worker only. The public site key will be added to
the Jekyll configuration after deployment.

## 4. Deploy the Worker

Create a Worker in the Cloudflare dashboard and replace its code with
`submission-worker.js`. In **Settings → Variables and Secrets**, add the Google
Form post URL, all `entry.*` mappings, `ALLOWED_ORIGINS`, and
`ALLOWED_HOSTNAMES` as plain-text variables. Add `TURNSTILE_SECRET_KEY` as an
encrypted secret, then deploy the new version.

The Worker checks the request origin and also confirms that Turnstile returned
an allowed hostname and the correct `contact` or `subscribe` action.

## 5. Connect the website

Copy the deployed Worker URL and public Turnstile site key into `_config.yml`:

```yml
forms:
  worker_url: "https://cut-circle-forms.YOUR-SUBDOMAIN.workers.dev/"
  turnstile_sitekey: "YOUR_PUBLIC_SITE_KEY"
```

Restart Jekyll after changing `_config.yml`. The Turnstile secret, Google Form
URL, and `entry.*` IDs must never be placed in the public Jekyll configuration.
