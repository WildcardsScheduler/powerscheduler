import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zena8twd';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

import { schemaTypes } from './src/sanity/schemas';

export default defineConfig({
  name: 'default',
  title: 'Wildcards Volleyball Club CMS',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
