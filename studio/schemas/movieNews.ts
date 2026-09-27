import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'movieNews',
  title: 'Movie News & Funnel',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Movie Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'poster',
      title: 'Movie Poster',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'financialNews',
      title: 'Financial News Body',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'youtubeReactions',
      title: 'YouTube Reaction Data',
      type: 'text',
    }),
    defineField({
      name: 'telegramLink',
      title: 'Telegram Channel Link',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'poster',
    },
  },
})
