import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'coach',
  title: 'Coaches',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          { title: 'Technical Director', value: 'Technical Director' },
          { title: 'Head Coach', value: 'Head Coach' },
          { title: 'Assistant Coach', value: 'Assistant Coach' },
          { title: 'Staff Coach', value: 'Staff Coach' },
        ],
      },
    }),
    defineField({
      name: 'teamAssigned',
      title: 'Assigned Team',
      type: 'string',
    }),
    defineField({
      name: 'photo',
      title: 'Headshot Photo (with Smart Face Crop)',
      type: 'image',
      options: {
        hotspot: true, // Enables target focal point for cropping heads & faces!
      },
    }),
    defineField({
      name: 'certifications',
      title: 'Certifications',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'bio',
      title: 'Bio / Summary',
      type: 'text',
    }),
    defineField({
      name: 'email',
      title: 'Contact Email',
      type: 'string',
    }),
  ],
});
