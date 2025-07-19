import { defineMiddleware } from "astro/middleware";

// Extend the Astro locals type to include isMobile
declare global {
  namespace App {
    interface Locals {
      isMobile: boolean;
    }
  }
}

export const onRequest = defineMiddleware((context, next) => {
  // Check if the request is from a mobile device
  const userAgent = context.request.headers.get("user-agent") || "";
  const sechUa = context.request.headers.get("sec-ch-ua-platform") || "";

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || /Android|iOS/i.test(sechUa);

  // Add mobile detection to locals for use in components and pages
  context.locals.isMobile = isMobile;

  console.log("middleware - isMobile:", isMobile, "User-Agent:", userAgent);

  return next();
}); 