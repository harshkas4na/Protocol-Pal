import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Use webpack explicitly
  webpack: (config, { isServer }) => {
    const webpack = require('webpack');
    
    // Ignore test dependencies
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^tape$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^why-is-node-running$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^tap$/,
      })
    );

    // Replace test files with empty module
    const emptyModulePath = path.resolve(__dirname, 'empty-module.js');
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /node_modules\/.*\/thread-stream\/test\/.*\.js$/,
        emptyModulePath
      )
    );

    return config;
  },
  // Add empty turbopack config to avoid error
  turbopack: {},
  // Externalize packages that shouldn't be bundled
  serverExternalPackages: [
    '@walletconnect/sign-client',
    '@walletconnect/universal-provider',
    '@walletconnect/ethereum-provider',
  ],
};

export default nextConfig;
