/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable static export for production builds, not dev mode
  // This allows dynamic routes to work in development
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Configure MDX support
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  
  // Webpack configuration for MDX
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.mdx?$/,
      use: [
        options.defaultLoaders.babel,
        {
          loader: '@mdx-js/loader',
          options: {
            providerImportSource: '@mdx-js/react',
          },
        },
      ],
    });
    
    return config;
  },
  
  // Strict mode for better React practices
  reactStrictMode: true,
  
  // Trailing slashes for static hosting compatibility
  trailingSlash: true,
  
  // Base path (can be configured for different deployments)
  // basePath: '',
};

export default nextConfig;
