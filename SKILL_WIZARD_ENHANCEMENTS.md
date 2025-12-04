# Skill Creation Wizard - Enhancement Specification

## Overview
This document specifies the complete 6-step skill creation wizard enhancement for the Alfred AI Automation Platform.

**Location**: `/app/dashboard/skills/new/page.js`

## Enhanced 6-Step Workflow

### Step 1: Basic Information
- Skill Name (required)
- Skill Description (required)

### Step 2: Trigger Type Selection
Three trigger options:
- **Manual**: Run on demand
- **Schedule**: Run on a schedule (with cron)
- **Webhook**: Trigger via HTTP

### Step 3: Trigger Configuration

**For Schedule:**
- Cron preset selector with common schedules
- Custom cron expression input
- Validation and help text

**For Webhook:**
- Auto-generated webhook URL
- Copy to clipboard button
- Example cURL command

**For Manual:**
- Info message (no configuration needed)

### Step 4: Connection Selection
- Display available MCP connections
- Multi-select checkboxes
- Show connection type and status
- Optional step (can proceed without connections)

### Step 5: Steps Definition
- Add/remove workflow steps
- For each step:
  - Prompt (required)
  - Guidance (optional)
  - Allowed Tools (optional, multi-input)

### Step 6: Review & Create
- Display all configurations
- Create button with loading state
- POST to `/api/proxy/vm/skills`
- Redirect to `/dashboard/skills` on success

## Implementation Highlights

### New State Fields
```javascript
selectedConnections: [],  // Array of connection IDs
generatedWebhookUrl: "",  // Auto-generated webhook URL
```

### Webhook URL Generation
Format: `{origin}/api/webhooks/skills/{slugified-name}-{timestamp}`
- Auto-generates based on skill name
- Updates when name changes
- Unique timestamp suffix

### Cron Presets
- Every hour: `0 * * * *`
- Every 6 hours: `0 */6 * * *`
- Daily at 9 AM: `0 9 * * *`
- Weekdays at 9 AM: `0 9 * * 1-5`
- Weekly on Monday: `0 9 * * 1`
- Monthly on 1st: `0 9 1 * *`
- Custom

### Enhanced API Payload
```javascript
{
  name: string,
  description: string,
  trigger_type: "manual" | "schedule" | "webhook",
  trigger_config: {
    cron?: string,        // For schedule
    url?: string,         // For webhook
    method?: "POST"       // For webhook
  },
  connections?: string[], // Optional array of connection IDs
  steps: [{
    id: number,
    prompt: string,
    guidance?: string,
    allowedTools?: string[]
  }],
  is_active: boolean
}
```

## Key Features

1. **Progressive Disclosure**: Each step focuses on one aspect
2. **Smart Defaults**: Pre-filled cron for schedule, auto-generated webhook URL
3. **Visual Feedback**: Progress indicator, loading states, validation messages
4. **Flexible Configuration**: Optional connections, optional step fields
5. **Copy-Paste Friendly**: Webhook URL with copy button, example commands

## Testing Checklist

- [ ] Navigate forward and backward through all steps
- [ ] Validate required fields on each step
- [ ] Test schedule trigger with preset and custom cron
- [ ] Test webhook trigger URL generation and copy
- [ ] Test connection selection (select/deselect multiple)
- [ ] Test adding/removing workflow steps
- [ ] Review screen shows all configurations correctly
- [ ] Successful submission and redirect
- [ ] Error handling for API failures

---

**Document Created**: December 3, 2025
**Related Files**:
- `/app/dashboard/skills/new/page.js` - Main wizard component
- `/app/api/proxy/vm/skills/route.js` - API endpoint
- `/app/dashboard/skills/page.js` - Skills list page

Generated with Claude Code
