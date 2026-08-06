# OpenNext for Cloudflare — wraps the Next.js build so it runs on Cloudflare Pages'
# Workers runtime (instead of Node). This produces a .open-next/dist directory
# that can be deployed with `wrangler pages deploy`.
#
# Docs: https://opennext.js.org/cloudflare

import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({});
