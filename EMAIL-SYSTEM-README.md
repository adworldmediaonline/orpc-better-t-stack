# Email Scheduling and Tracking System

## 🎉 Implementation Complete!

A comprehensive, production-ready email scheduling and tracking system has been successfully implemented with the following features:

### ✅ Features Implemented

1. **Email Scheduling**
   - Single email scheduling with customizable send time
   - Bulk email scheduling via CSV upload
   - Immediate or future-scheduled delivery
   - Automatic email processing via cron jobs

2. **Email Tracking**
   - Real-time delivery status tracking
   - Email open tracking (via Resend webhooks)
   - Click tracking
   - Bounce detection
   - Spam complaint monitoring

3. **User Interface**
   - Dashboard with email campaign statistics
   - Email list with filtering and search
   - Create email form (single & bulk)
   - Email detail view with recipient tracking
   - Beautiful, modern UI with shadcn/ui components

4. **Backend Services**
   - RESTful API with 8 protected procedures
   - Node-cron scheduler for automated sending
   - Resend webhook handler for event tracking
   - CSV parsing for bulk uploads
   - Retry logic for failed emails

## 📦 Architecture

### Database Models

**Email**
- Subject, HTML body, text body
- Scheduled time, sent time
- Status (SCHEDULED, SENDING, SENT, FAILED, CANCELLED)
- Error tracking for failed sends

**EmailRecipient**
- Individual tracking per recipient
- Status progression (PENDING → DELIVERED → OPENED → CLICKED)
- Bounce and spam complaint tracking
- Timestamps for all events

**EmailEvent**
- Audit log for all email events
- IP address and user agent tracking
- Raw webhook data storage

### Technology Stack

- **Email Provider**: Resend (3,000 free emails/month)
- **Scheduler**: node-cron (every minute)
- **Database**: PostgreSQL via Prisma
- **Frontend**: Next.js 15 + React Query
- **UI**: shadcn/ui + Tailwind CSS
- **Type Safety**: Full end-to-end with oRPC

## 🚀 Getting Started

### 1. Environment Setup

Add the following to your `.env` file:

\`\`\`env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=your-verified@domain.com

# Cron Configuration
ENABLE_CRON=true
CRON_SECRET=your-random-secret-key-here

# Optional: Webhook Secret (from Resend dashboard)
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
\`\`\`

### 2. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain or use their testing domain
3. Create an API key from the dashboard
4. Add it to your `.env` file

### 3. Configure Webhooks (for tracking)

1. Go to Resend Dashboard → Webhooks
2. Add webhook URL: `https://orpc-better-t-stack-web.vercel.app/api/webhooks/resend`
3. Select events: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`
4. Copy the webhook secret to your `.env` file

### 4. Run the Application

\`\`\`bash
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev:web
\`\`\`

The cron job will automatically start if `ENABLE_CRON=true`.

## 📖 Usage Guide

### Creating a Single Email

1. Navigate to `/emails/new`
2. Fill in the form:
   - Subject (required, max 255 chars)
   - Recipient email (required)
   - Recipient name (optional)
   - HTML body (required)
   - Plain text body (optional)
   - Schedule time (leave empty for immediate)
3. Click "Schedule Email"

### Bulk Email Upload

1. Go to `/emails/new` → Bulk Upload tab
2. Prepare CSV with columns: `email`, `name` (optional)
3. Fill in common template (subject & body)
4. Upload CSV file
5. Set schedule time (optional)
6. Click "Schedule Bulk Email"

**CSV Example:**
\`\`\`csv
email,name
john@example.com,John Doe
jane@example.com,Jane Smith
\`\`\`

### Viewing Emails

- **Dashboard** (`/dashboard`): Overview statistics
- **Email List** (`/emails`): All emails with filters
- **Email Detail** (`/emails/[id]`): Full tracking info

### Managing Emails

**Scheduled Emails:**
- Cancel before sending
- Update subject/body/schedule time

**Failed Emails:**
- Click "Retry" to reschedule

## 🔧 API Endpoints

All endpoints are type-safe via oRPC:

### Protected Procedures

1. `emails.createEmail` - Create single scheduled email
2. `emails.createBulkEmail` - Upload CSV for bulk sending
3. `emails.getEmails` - List with pagination & filters
4. `emails.getEmailById` - Get full email details
5. `emails.updateEmail` - Update scheduled email
6. `emails.cancelEmail` - Cancel scheduled email
7. `emails.getEmailStats` - Dashboard statistics
8. `emails.retryFailedEmail` - Retry failed email

### Webhook Endpoint

- `POST /api/webhooks/resend` - Resend webhook handler
- `GET /api/cron` - Manual cron trigger (protected by CRON_SECRET)

## 📊 Email Tracking Flow

\`\`\`
1. Email Created (SCHEDULED)
   ↓
2. Cron picks up (status → SENDING)
   ↓
3. Sent via Resend (status → SENT)
   ↓
4. Webhook: email.delivered (recipient → DELIVERED)
   ↓
5. Webhook: email.opened (recipient → OPENED)
   ↓
6. Webhook: email.clicked (recipient → CLICKED)

Alternative paths:
- Webhook: email.bounced (recipient → BOUNCED)
- Webhook: email.complained (recipient → COMPLAINED)
\`\`\`

## 🎨 UI Components

Reusable components created:

- `EmailStatusBadge` - Color-coded email status
- `RecipientStatusBadge` - Recipient tracking status
- `EmailStatsCard` - Dashboard statistics card
- `EmailListItem` - Email list row
- `RecipientTable` - Recipient tracking table
- `CsvUploader` - Drag & drop CSV upload

## ⚡ Performance Optimizations

1. **Batch Processing**: Max 10 emails per cron run
2. **Database Indexes**: On userId, status, scheduledFor, resendEmailId
3. **Pagination**: 20 items per page
4. **Query Optimization**: Eager loading with includes
5. **Rate Limiting**: Respects Resend limits (10/sec free tier)

## 🔒 Security Features

1. **Authentication**: All routes protected by user session
2. **Ownership Checks**: Users can only access their emails
3. **Input Validation**: Comprehensive Zod schemas
4. **Webhook Verification**: Verify Resend signatures
5. **SQL Injection Protection**: Prisma ORM
6. **XSS Protection**: Sanitized HTML display

## 🐛 Troubleshooting

### Emails not sending?

1. Check `ENABLE_CRON=true` in `.env`
2. Verify Resend API key is valid
3. Check console for cron job logs
4. Ensure scheduled time is in the past
5. Verify email status is `SCHEDULED`

### Tracking not working?

1. Verify webhook URL is publicly accessible
2. Check Resend dashboard for webhook deliveries
3. Ensure `RESEND_WEBHOOK_SECRET` is set
4. Check webhook route at `/api/webhooks/resend`

### CSV upload failing?

1. Ensure CSV has `email` column (case-insensitive)
2. Check email format validity
3. File must be `.csv` extension
4. Max recommended: 1000 recipients per batch

## 📈 Metrics & Analytics

Dashboard shows:

- **Total Emails**: All campaigns
- **Scheduled**: Pending delivery
- **Sent**: Successfully delivered
- **Delivery Rate**: % of emails delivered
- **Open Rate**: % of delivered emails opened
- **Bounce Rate**: % of emails bounced

## 🚦 Testing Checklist

- ✅ Create single email (immediate)
- ✅ Schedule email for future
- ✅ Upload CSV bulk emails
- ✅ Cancel scheduled email
- ✅ Retry failed email
- ✅ View email list with filters
- ✅ Search emails by subject/recipient
- ✅ View email detail with tracking
- ✅ Webhook events update status
- ✅ Cron job processes scheduled emails
- ✅ Dashboard shows accurate stats

## 💰 Cost Breakdown

**Free Tier (Resend):**
- 3,000 emails/month
- 100 emails/day
- Email tracking included
- Webhooks included

**Recommended for Production:**
- Resend Pro: $20/month for 50,000 emails
- No additional costs for tracking/webhooks
- Scales linearly with volume

## 🔮 Future Enhancements

Potential improvements:

1. **Email Templates**: Pre-built templates library
2. **WYSIWYG Editor**: Rich text email composer
3. **A/B Testing**: Split test subject lines
4. **Unsubscribe**: One-click unsubscribe links
5. **Email List Management**: Contact groups
6. **Advanced Analytics**: Click heatmaps
7. **BullMQ Integration**: Distributed job queue
8. **Rate Limiting**: Per-user sending limits
9. **Email Validation**: Real-time email verification
10. **Scheduled Reports**: Daily/weekly summaries

## 📝 File Structure

\`\`\`
packages/
├── email-service/          # Core email service
│   ├── src/
│   │   ├── resend-client.ts      # Resend SDK instance
│   │   ├── email-sender.ts       # Email sending logic
│   │   ├── email-scheduler.ts    # Cron processing
│   │   ├── bulk-processor.ts     # CSV parsing
│   │   └── index.ts
│   └── package.json
├── api/src/routers/
│   └── email-router.ts     # 8 API procedures
└── db/prisma/schema/
    └── auth.prisma         # Email models

apps/web/src/
├── app/
│   ├── emails/
│   │   ├── page.tsx              # Email list
│   │   ├── emails-content.tsx    # List logic
│   │   ├── new/
│   │   │   ├── page.tsx
│   │   │   └── create-email-content.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── email-detail-content.tsx
│   ├── dashboard/
│   │   └── dashboard.tsx         # Email stats
│   ├── api/
│   │   ├── webhooks/resend/route.ts
│   │   └── cron/route.ts
│   └── lib/cron/
│       └── email-scheduler.ts
└── components/
    ├── email-status-badge.tsx
    ├── recipient-status-badge.tsx
    ├── email-stats-card.tsx
    ├── email-list-item.tsx
    ├── recipient-table.tsx
    └── csv-uploader.tsx
\`\`\`

## 🎓 Learning Resources

- [Resend Documentation](https://resend.com/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Query Guide](https://tanstack.com/query/latest)
- [Node-cron Documentation](https://github.com/node-cron/node-cron)

## ✨ Success!

Your email scheduling and tracking system is now fully operational! Start by creating your first campaign at `/emails/new`.

For support, check the troubleshooting section or review the implementation code.

---

**Built with ❤️ using Resend, Prisma, Next.js, and oRPC**

