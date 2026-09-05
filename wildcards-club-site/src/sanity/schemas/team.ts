import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'team',
  title: 'Teams',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Team Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'division',
      title: 'Division',
      type: 'string',
      options: {
        list: [
          '13U Girls', '14U Girls', '15U Girls', '16U Girls', '17U Girls', '18U Girls',
          '14U Boys', '15U Boys', '16U Boys', '17U Boys', '18U Boys'
        ],
      },
    }),
    defineField({
      name: 'badgeColor',
      title: 'Badge Color (Hex)',
      type: 'string',
      initialValue: '#dc2626',
    }),
    defineField({
      name: 'headCoach',
      title: 'Head Coach Name',
      type: 'string',
    }),
    defineField({
      name: 'assistantCoach',
      title: 'Assistant Coach Name',
      type: 'string',
    }),
    defineField({
      name: 'practiceSchedule',
      title: 'Practice Schedule',
      type: 'string',
    }),
    defineField({
      name: 'homeGym',
      title: 'Home Gym Location',
      type: 'string',
    }),
    defineField({
      name: 'teamPhoto',
      title: 'Team Roster Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
});
