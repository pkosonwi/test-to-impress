
/**
 * Converts an image URL to a Base64 encoded string.
 * Note: This function can fail due to CORS (Cross-Origin Resource Sharing) policies
 * if the image is hosted on a server that doesn't allow requests from the app's origin.
 * For production, ensure images are served with appropriate CORS headers.
 * A server-side proxy is a common solution to bypass this client-side limitation.
 */
export const imageUrlToBase64 = async (url: string): Promise<string> => {
  try {
    // The previous CORS proxy was unreliable. Switching to corsproxy.io.
    // Public proxies can be flaky; a dedicated server-side proxy is best for production.
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // The result includes the Base64 prefix (e.g., "data:image/png;base64,"), which we need.
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to convert image URL to Base64:", error);
    throw new Error("Could not load model image. This might be a CORS issue or the image URL is invalid.");
  }
};
