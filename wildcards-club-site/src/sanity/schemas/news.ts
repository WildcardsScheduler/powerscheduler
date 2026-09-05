import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'news',
  title: 'News & Announcements',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Article Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: ['Announcement', 'Tryouts', 'Tournament', 'Club Update', 'Coaching'],
      },
    }),
    defineField({
      name: 'date',
      title: 'Publication Date',
      type: 'date',
    }),
    defineField({
      name: 'summary',
      title: 'Short Summary',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'content',
      title: 'Full Article Body',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      initialValue: 'Rocky Wildcards Admin',
    }),
    defineField({
      name: 'image',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
});
