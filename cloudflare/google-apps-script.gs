const NOTIFICATION_RECIPIENT = "benjaminory@gmail.com";

/**
 * Sends a plain-text notification for each response recorded in the Google
 * Form's linked response spreadsheet. Install this as a spreadsheet form-submit
 * trigger by running installFormSubmitTrigger once.
 */
function onFormSubmit(event) {
  if (!event || !event.namedValues) {
    throw new Error("This function must run from a spreadsheet form-submit trigger.");
  }

  const category = readAnswer(event, "Category");
  const email = readAnswer(event, "Email");
  const source = readAnswer(event, "Source page");
  let subject;
  let bodyLines;

  if (category === "Subscribe") {
    const firstName = readAnswer(event, "First name");
    const lastName = readAnswer(event, "Last name");
    const subscriberName = [firstName, lastName].filter(Boolean).join(" ");
    subject = `[Cut Circle website] New subscriber: ${subscriberName || email}`;
    bodyLines = [
      "A visitor requested to be subscribed to Cut Circle news.",
      "",
      `First name: ${firstName}`,
      `Last name: ${lastName}`,
      `Email: ${email}`,
      `Source: ${source}`,
    ];
  } else if (category === "Contact") {
    const name = readAnswer(event, "Name");
    const message = readAnswer(event, "Message");
    subject = `[Cut Circle website] Message from ${name || email}`;
    bodyLines = [
      "A visitor sent a message through the Cut Circle contact page.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Source: ${source}`,
      "",
      "Message:",
      message,
    ];
  } else {
    throw new Error(`Unknown submission category: ${category}`);
  }

  const mail = {
    to: NOTIFICATION_RECIPIENT,
    subject,
    body: bodyLines.join("\n"),
    name: "Cut Circle website",
  };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) mail.replyTo = email;
  MailApp.sendEmail(mail);
}

function readAnswer(event, questionTitle) {
  const answer = event.namedValues[questionTitle];
  return Array.isArray(answer) ? String(answer[0] || "").trim() : "";
}

function installFormSubmitTrigger() {
  const spreadsheet = SpreadsheetApp.getActive();
  const alreadyInstalled = ScriptApp.getProjectTriggers().some((trigger) => (
    trigger.getHandlerFunction() === "onFormSubmit" &&
    trigger.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT
  ));

  if (!alreadyInstalled) {
    ScriptApp.newTrigger("onFormSubmit")
      .forSpreadsheet(spreadsheet)
      .onFormSubmit()
      .create();
  }
}
