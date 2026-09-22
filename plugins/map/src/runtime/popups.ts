import { clampNumber, isHexColor } from "./colors.js";

import { isRecord, type Feature, type Hexbin } from "./types.js";

export const escapeHtml = (value: unknown) => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export const getFeaturePopupHtml = (
  feature: Feature | null,
  baseUrl = window.location.href,
) => {
  const properties = feature?.properties;
  if (!properties || typeof properties !== "object") return null;

  const externalLinkIconHtml =
    '<svg aria-hidden="true" class="external-icon" style="max-width:0.8em;max-height:0.8em;" viewBox="0 0 512 512">' +
    '<path d="M320 0H288V64h32 82.7L201.4 265.4 178.7 288 224 333.3l22.6-22.6L448 109.3V192v32h64V192 32 0H480 320zM32 32H0V64 480v32H32 456h32V480 352 320H424v32 96H64V96h96 32V32H160 32z"></path>' +
    "</svg>";
  const getFeatureExternalUrl = (value: unknown) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;

    try {
      const url = new URL(trimmed, baseUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return url.href;
    } catch {
      return null;
    }
  };
  const getPostcards = () => {
    if (!Array.isArray(properties.postcards)) return [];
    return properties.postcards.filter((entry) => isRecord(entry));
  };
  const getPostcardRoleGroup = (value: unknown) => {
    if (typeof value !== "string") return "other";
    const normalized = value.trim().toLowerCase();
    if (normalized === "destination") return "to";
    if (normalized === "source") return "from";
    return "other";
  };
  const getPostcardUnknownPersonLabel = (value: unknown) => {
    if (typeof value !== "string") return "[person unknown]";
    const normalized = value.trim().toLowerCase();
    if (normalized === "destination") return "[recipient unknown]";
    if (normalized === "source") return "[sender unknown]";
    return "[person unknown]";
  };

  const address =
    typeof properties.address === "string"
      ? properties.address.trim()
      : isRecord(properties.address)
        ? typeof properties.address.multiline === "string"
          ? properties.address.multiline.trim()
          : ""
        : "";
  const notes =
    typeof properties.notes === "string" ? properties.notes.trim() : "";
  const nlsMapUrl = getFeatureExternalUrl(properties.nls_map_url);
  const postcards = getPostcards();
  const addressLines = address
    ? address
        .split(/\n+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    : [];
  const primaryAddressLine = addressLines[0] ?? "";
  const remainingAddressLines = addressLines.slice(1);
  const notesHtml = notes ? escapeHtml(notes).replace(/\n+/g, "<br>") : "";
  const renderExternalLink = (url: string | null, label: string) => {
    if (!url || !label) return "";
    return (
      '<a class="external directive-map__popup-link" href="' +
      escapeHtml(url) +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(label) +
      externalLinkIconHtml +
      "</a>"
    );
  };
  const featureSourceUrl = getFeatureExternalUrl(properties.source_url);
  const addressLinksHtml = [renderExternalLink(nlsMapUrl, "Historic map")]
    .concat([renderExternalLink(featureSourceUrl, "Source")])
    .filter((html) => html.length > 0)
    .join("");
  const addressHtml = (() => {
    if (!primaryAddressLine && remainingAddressLines.length === 0) return "";

    const headHtml =
      primaryAddressLine || addressLinksHtml
        ? '<div class="directive-map__popup-address-head">' +
          '<div class="directive-map__popup-address-line">' +
          escapeHtml(primaryAddressLine) +
          "</div>" +
          (addressLinksHtml
            ? '<div class="directive-map__popup-links">' +
              addressLinksHtml +
              "</div>"
            : "") +
          "</div>"
        : "";
    const restHtml =
      remainingAddressLines.length > 0
        ? '<div class="directive-map__popup-address-rest">' +
          escapeHtml(remainingAddressLines.join("\n")).replace(/\n+/g, "<br>") +
          "</div>"
        : "";

    return headHtml + restHtml;
  })();
  const postcardListHtml = (() => {
    const groups: Record<"to" | "from" | "other", Record<string, unknown>[]> = {
      to: [],
      from: [],
      other: [],
    };

    for (const postcard of postcards) {
      groups[getPostcardRoleGroup(postcard.role)].push(postcard);
    }

    const renderPostcard = (postcard: Record<string, unknown>) => {
      const summary =
        typeof postcard.year_summary === "string"
          ? postcard.year_summary.trim()
          : "";
      const summaryHtml = escapeHtml(summary || "[date unknown]");
      const recipient =
        typeof postcard.recipient === "string" ? postcard.recipient.trim() : "";
      const unknownPersonLabel = getPostcardUnknownPersonLabel(postcard.role);
      const recipientHtml =
        '<div class="directive-map__popup-postcard-recipient">' +
        escapeHtml(recipient || unknownPersonLabel) +
        "</div>";
      const postcardNotes =
        typeof postcard.notes === "string" ? postcard.notes.trim() : "";
      const postcardSourceUrl = getFeatureExternalUrl(postcard.source_url);
      const postcardNotesHtml = postcardNotes
        ? '<div class="directive-map__popup-note">' +
          escapeHtml(postcardNotes).replace(/\n+/g, "<br>") +
          "</div>"
        : "";
      const postcardSourceHtml = postcardSourceUrl
        ? '<div class="directive-map__popup-note">' +
          renderExternalLink(postcardSourceUrl, "Source") +
          "</div>"
        : "";

      return (
        '<div class="directive-map__popup-postcard">' +
        '<div class="directive-map__popup-postcard-head">' +
        recipientHtml +
        '<div class="directive-map__popup-postcard-year">' +
        summaryHtml +
        "</div>" +
        "</div>" +
        postcardSourceHtml +
        postcardNotesHtml +
        "</div>"
      );
    };

    const renderGroup = (title: string, group: Record<string, unknown>[]) => {
      if (group.length === 0) return "";
      return (
        '<div class="directive-map__popup-postcard-group">' +
        '<div class="directive-map__popup-postcard-group-title">' +
        escapeHtml(title) +
        "</div>" +
        group.map((postcard) => renderPostcard(postcard)).join("") +
        "</div>"
      );
    };

    return [
      renderGroup("Postcards received at this address", groups.to),
      renderGroup("Postcards sent from this address", groups.from),
      renderGroup("Other", groups.other),
    ].join("");
  })();
  const popupParts = [];
  if (addressHtml) {
    popupParts.push(
      '<div class="directive-map__popup-address">' + addressHtml + "</div>",
    );
  }
  if (notesHtml) {
    popupParts.push(
      '<div class="directive-map__popup-note">' + notesHtml + "</div>",
    );
  }
  if (postcardListHtml) {
    popupParts.push(
      '<div class="directive-map__popup-section">' +
        '<div class="directive-map__popup-postcards">' +
        postcardListHtml +
        "</div>" +
        "</div>",
    );
  }

  return popupParts.length
    ? '<div class="directive-map__popup">' + popupParts.join("") + "</div>"
    : null;
};

export const buildHexbinPopupHtml = (bin: Hexbin) => {
  if (!bin || typeof bin !== "object") return null;
  const totalCount = Number(bin.count);
  const mixes = Array.isArray(bin.mixes) ? bin.mixes : [];
  if (!Number.isFinite(totalCount) || totalCount <= 0 || mixes.length === 0) {
    return null;
  }

  const summary = totalCount + (totalCount === 1 ? " point" : " points");
  const rows = mixes.map((mix) => {
    const label =
      typeof mix?.label === "string" && mix.label.trim().length > 0
        ? mix.label.trim()
        : "Points";
    const count = Number(mix?.count);
    const percentage = clampNumber(
      Math.round((count / totalCount) * 100),
      0,
      100,
    );
    const swatchColor = isHexColor(mix?.color) ? mix.color.trim() : "#3388ff";
    return (
      '<div class="directive-map__popup-note">' +
      '<span style="display:inline-block;width:0.72rem;height:0.72rem;margin-right:0.42rem;border-radius:999px;vertical-align:-0.08rem;background:' +
      swatchColor +
      ';"></span>' +
      escapeHtml(label) +
      " " +
      percentage +
      "% (" +
      count +
      (count === 1 ? " point" : " points") +
      ")</div>"
    );
  });

  return "<strong>" + summary + "</strong>" + rows.join("");
};
