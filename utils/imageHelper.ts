
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

/**
 * Removes white (or near-white) background from an image URL.
 * Returns a new Base64 encoded string of the image with a transparent background.
 */
export const removeWhiteBackground = async (imageUrl: string, threshold: number = 240): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Use a CORS proxy for cross-origin images
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error("Could not get canvas context"));
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // If the pixel is close to white, make it transparent
        if (r > threshold && g > threshold && b > threshold) {
          data[i + 3] = 0; // Set alpha to 0
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => {
      console.error("Failed to load image for background removal:", err);
      reject(new Error("Could not load image. This might be a CORS issue."));
    };

    // Use the same CORS proxy strategy as imageUrlToBase64
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
    img.src = proxyUrl;
  });
};
