(() => {
  "use strict";

  function decodeBase64Utf8(encodedValue) {
    try {
      const bytes = Uint8Array.from(atob(encodedValue), (char) => char.charCodeAt(0));
      return new TextDecoder("utf-8").decode(bytes);
    } catch (error) {
      console.error("Failed to decode Base64 string: ", error);
      return null;
    }
  }

  function showDecodedValue(element, value) {
    if (element.hasAttribute("data-show-value")) {
      element.textContent = value;
    }
  }

  document.querySelectorAll("[data-encoded-email]").forEach((element) => {
    const decoded = decodeBase64Utf8(element.getAttribute("data-encoded-email"));
    if (!decoded) {
      element.style.display = "none";
      return;
    }

    element.setAttribute("href", `mailto:${decoded}`);
    showDecodedValue(element, decoded);
  });

  document.querySelectorAll("[data-encoded-phone]").forEach((element) => {
    const decoded = decodeBase64Utf8(element.getAttribute("data-encoded-phone"));
    if (!decoded) {
      element.style.display = "none";
      return;
    }

    element.setAttribute("href", `tel:${decoded.replace(/[^\d+]/g, "")}`);
    showDecodedValue(element, decoded);
  });
})();
