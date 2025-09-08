
/**
 * Converts an image URL to a Base64 encoded string.
 */
export const imageUrlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
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
