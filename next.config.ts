import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/index.php', destination: '/', permanent: true },
      { source: '/convencoes-coletivas', destination: '/convencoes', permanent: true },
      { source: '/downloads', destination: '/convencoes', permanent: true },
      { source: '/contatos', destination: '/contato', permanent: true },
    ];
  },
};

export default nextConfig;
