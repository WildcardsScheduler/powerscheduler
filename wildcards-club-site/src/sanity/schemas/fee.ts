import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'fee',
  title: 'Fee Tiers',
  type: 'document',
  fields: [
    defineField({
      name: 'division',
      title: 'Division Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'totalFee',
      title: 'Total Season Fee ($)',
      type: 'number',
    }),
    defineField({
      name: 'depositAmount',
      title: 'Initial Deposit ($)',
      type: 'number',
    }),
    defineField({
      name: 'monthlyPayments',
      title: 'Installment Schedule',
      type: 'string',
    }),
    defineField({
      name: 'includes',
      title: 'Included Items',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
});
