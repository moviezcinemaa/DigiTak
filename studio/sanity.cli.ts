import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || '6rq4jwl0',
    dataset: 'production'
  },
  studioHost: 'gofact-movies'
})
