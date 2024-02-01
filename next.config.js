// This file is used in the tests to mock the next.config.js file!!!
// It's not actually used by the library, it's just a mock file for testing purposes.

import { withNextVideo } from 'next-video/process';

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextVideo(nextConfig);
