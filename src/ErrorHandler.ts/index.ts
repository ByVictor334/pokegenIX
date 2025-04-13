export const handleError = (error: any) => {
  // OpenAI API errors
  if (error.message.includes("openai")) {
    return {
      status: 503,
      success: false,
      error: "Service is currently unavailable. Please try again later.",
    };
  }

  // Image processing errors
  if (error.message.includes("Sharp") || error.message.includes("image")) {
    return {
      status: 400,
      success: false,
      error:
        "Invalid image format or processing error. Please try again with a different image.",
    };
  }

  // Rate limit errors
  if (error.message.includes("rate limit") || error.message.includes("quota")) {
    return {
      status: 429,
      success: false,
      error: "Rate limit exceeded. Please try again later.",
    };
  }

  // Default server error
  return {
    status: 500,
    success: false,
    error: `Internal server error: ${error.message}`,
  };
};
