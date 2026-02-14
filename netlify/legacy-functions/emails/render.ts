import { EMAIL_TEMPLATE } from "./template";

type EmailParams = {
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
};

export function renderEmail({
  title,
  message,
  ctaLabel,
  ctaUrl,
}: EmailParams) {
  return EMAIL_TEMPLATE
    .replace("{{TITLE}}", title)
    .replace("{{MESSAGE}}", message)
    .replace("{{CTA_LABEL}}", ctaLabel)
    .replace("{{CTA_URL}}", ctaUrl);
}