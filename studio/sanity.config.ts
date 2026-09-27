import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'default',
  title: 'GoFact Studio',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '6rq4jwl0',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  cors: {
    allowOrigins: [
      'http://localhost:5173',
      'https://gofact-frontend.onrender.com',
    ],
    allowCredentials: true,
  },
})
