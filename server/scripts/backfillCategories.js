import { entities } from '../services/entities.js';

const categoryMap = {
  'ChatGPT': 'AI',
  'Github CoPilot': 'AI',
  'Notion': 'Notetaking',
  'Retool': 'Internal Tools',
  'Google Analytics': 'Website analytics',
  'Evernote': 'Notetaking',
  'WordPress': 'CMS',
  'Medium': 'CMS',
  'ConvertKit': 'Email marketing',
  'Static website generator': 'CMS',
  'Wix, Strikingly, Webflow': 'CMS',
  'Noun Project': 'Design',
  'Figma': 'Design',
  'Typeform': 'Form Building',
  'Fullstory': 'Session replay software',
  'Contentful': 'CMS',
  'Papertrail': 'Log Management',
  'To-do app': 'Project Management',
  'Community management': 'Community Platform',
  'Trello': 'Project Management',
  'Twitter': 'Social Media',
  'Zendesk, Freshdesk': 'Helpdesk Solution',
  'Calendly': 'Scheduling',
  'Airtable': 'No-code database',
  'Slack, Discord': 'Communication',
  'Intercom': 'Customer Engagement',
  'Auth0': 'Auth & SSO',
  'Algolia': 'Enterprise Search',
  'Firebase': 'Backend as a service',
  'Segment': 'Customer Data Platform',
  'Bitly': 'Marketing SaaS',
  'Shopify': 'E-commerce',
  '1Password': 'Password manager',
  'Mailgun, SendGrid': 'Email marketing',
  'Stripe, Chargebee': 'Financial Service',
  'File uploader': 'File Hosting',
  'Notification infrastructure': 'Messaging',
  'Postman': 'API Platform',
  'Programmatic videos': 'Marketing SaaS',
  'Snowflake': 'Cloud Data Warehouse',
  'Annotation': 'ML Ops',
  'Feature management/ Feature flag': 'Feature flag and toggle management',
  'Mixpanel, Amptitude': 'Product Analytics',
  'Google Meet, Skype': 'Video Conferencing',
  'Dropbox': 'Cloud Storage',
  'Tableau, Looker, Power BI': 'Business Intelligence',
  'Heroku, Netlify, Vercel': 'Platform as a service',
  'Twilio': 'Communication',
  'Sentry': 'Observability and monitoring',
  'Invoicing': 'Financial Service',
  'Graph database': 'Graph database',
  'Vector database': 'No-code database',
  'Time-series database': 'Timeseries database',
  'DocuSign': 'Digital Signature',
  'Zapier': 'Workflow automation',
  'Asana, JIRA': 'Project Management',
  'Toggl, Clockify': 'Project Management',
  'Empower Personal Wealth': 'Financial Service',
  'Salesforce, Hubspot': 'Customer Engagement',
  'Tray.io, Merge.dev': 'Workflow automation',
  'SurveyMonkey, Qualtrics': 'Surveys'
};

async function backfillCategories() {
  console.log('Fetching alternatives with missing categories...');
  const alts = await entities.Alternative.list();
  
  let count = 0;
  for (const alt of alts) {
    if (!alt.category) {
      const mappedCat = categoryMap[alt.paid_tool_name];
      if (mappedCat) {
        await entities.Alternative.update(alt.id, { category: mappedCat });
        count++;
      } else {
        // Fallback for any missed tools
        await entities.Alternative.update(alt.id, { category: 'Other' });
        count++;
      }
    }
  }

  console.log(`Successfully mapped and backfilled ${count} categories.`);
}

backfillCategories().catch(console.error);
