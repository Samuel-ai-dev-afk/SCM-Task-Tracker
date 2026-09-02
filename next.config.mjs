/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /*
    Baseline response headers. None of these change how the app behaves; they
    close off the cheap attacks a public URL attracts.
  */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // The tracker is never meant to be framed — blocks clickjacking.
          { key: "X-Frame-Options", value: "DENY" },
          // Stop browsers guessing a response is something it isn't.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't leak task URLs to sites people click through to.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nothing here needs a camera, microphone or location.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
