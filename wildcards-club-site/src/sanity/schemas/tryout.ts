import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'tryout',
  title: 'Tryout Schedules',
  type: 'document',
  fields: [
    defineField({
      name: 'ageGroup',
      title: 'Age Group (e.g. 15U Girls)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'string',
    }),
    defineField({
      name: 'time',
      title: 'Time (e.g. 6:00 PM - 8:00 PM)',
      type: 'string',
    }),
    defineField({
      name: 'location',
      title: 'Gym Location',
      type: 'string',
    }),
    defineField({
      name: 'fee',
      title: 'Tryout Fee',
      type: 'string',
      initialValue: '$25 per athlete',
    }),
    defineField({
      name: 'status',
      title: 'Registration Status',
      type: 'string',
      options: {
        list: ['Open', 'Closing Soon', 'Full', 'Completed'],
      },
    }),
  ],
});
