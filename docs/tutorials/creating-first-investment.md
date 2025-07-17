# 💰 Creating Your First Investment

In this tutorial, you'll learn how to create an investment record using The Pitch Fund's investment wizard. This will teach you the core workflow and key concepts.

## What You'll Learn

By the end of this tutorial, you'll understand:
- ✅ How the investment creation process works
- ✅ The difference between auto-populated and manual fields
- ✅ How to use the QuickPaste feature with AngelList memos
- ✅ How founder and company data is structured

## Prerequisites

- ✅ Completed [Getting Started](getting-started.md) tutorial  
- ✅ Local development environment running
- ✅ Admin account created and logged in

---

## Understanding the Investment Wizard

The Pitch Fund uses a 3-step wizard to create investments:

- **Step 1:** Fields that can be auto-populated from AngelList memos
- **Step 2:** Company details and founder information
- **Step 3:** Marketing information, pitch details, and VC selection

This separation makes data entry faster while ensuring data quality and comprehensive relationship tracking.

---

## Step 1: Navigate to Investment Creation

1. Open your local development environment (`http://localhost:3001`)
2. Log into the admin interface (`/admin`)
3. Click **"Add New Investment"**

You should see the Investment Wizard with Step 1 open.

---

## Step 2: Try the QuickPaste Feature (Optional)

The QuickPaste panel on the right can automatically extract information from AngelList investment memos.

### Using QuickPaste

1. **Find an AngelList memo** (or use the sample below)
2. **Paste it into the QuickPaste panel**
3. **Click outside the textarea** to trigger parsing
4. **Watch fields auto-populate** in the main form

### Sample AngelList Memo

```
Company: Acme Startup Inc.
Website: https://acmestartup.com
Investment Date: January 15, 2024
Investment Amount: $250,000
Instrument: SAFE (Post-Money)
Round Size: $2,000,000
Conversion Cap: $8,000,000
Country: United States
Incorporation: C-Corporation

Founder 1:
- Name: Jane Smith
- Email: jane@acmestartup.com
- Role: CEO

Founder 2:
- Name: John Doe  
- Email: john@acmestartup.com
- Role: CTO
```

### What Gets Auto-Populated

After parsing, you should see:
- Company name and basic details
- Investment terms and amounts  
- Founder information
- Incorporation details

---

## Step 3: Marketing & Pitch Information with VC Selection 🎯🤝

**Purpose**: Marketing information, pitch details, episode data, AI-powered transcript analysis, and VC relationship management

**Fields**:
- **Pitch Episode URL** *(with thepitch.show domain validation and auto-data extraction)*
- **Episode Publish Date** *(automatically populated from episode URL)*
- **Episode Title** *(automatically populated from episode URL - includes episode number)*
- **Episode Season** *(automatically populated from episode URL - dropdown 1-50)*
- **Episode Show Notes** *(automatically populated from episode URL - truncated at ellipsis)*
- **Pitch Transcript** *(Large textarea for 4k-6k token transcripts)*
- Tagline * *(with ✨ AI Generation from transcript)*
- Website URL * *(with auto-population and validation)*
- Industry Tags *(with ✨ AI Generation from transcript)*
- Business Model Tags *(with ✨ AI Generation from transcript)*
- Keywords *(with ✨ AI Generation from transcript)*
- **VC Selection and Relationships**

**✨ Episode Auto-Extraction Features**:
- **Comprehensive Data Collection**: Single episode URL extracts title, season, show notes, publish date, and transcript
- **Smart Show Notes Truncation**: Automatically stops at ellipsis patterns for clean content
- **Season Detection**: Intelligent extraction from multiple sources (URLs, links, content patterns)
- **Episode Title Normalization**: Includes episode numbers and full episode names
- **Instant Population**: No button clicks required - happens automatically on URL validation

---

## Step 4: Complete Step 2 (Additional Information)

Step 2 contains information that typically requires manual entry:

### Investment Details
- **IC/LP Memo** *(required)*: Investment reasoning
- **Co-Investors**: Other investors in the round
- **Industry Tags**: Relevant categories

### Founder Information
The form starts with one founder. Fill in:
- **Email** *(required)*: Primary contact
- **Name**: Full name  
- **LinkedIn URL** *(required)*: Professional profile
- **Title** *(required)*: Job title (e.g., "CEO", "CTO")
- **Role**: Founder or Co-Founder
- **Sex** *(required)*: Gender for analytics
- **Bio**: Background information

### Adding More Founders
Click **"Add Another Founder"** to add co-founders.

---

## Step 5: Save Your Investment

1. **Review all information** for accuracy
2. **Click "Create Investment"**
3. **Wait for confirmation** message

**Success!** You should see a success message and be redirected to the investment details.

---

## Step 6: Verify Your Investment

### Check the Admin Dashboard
1. Go back to `/admin`
2. Your new investment should appear in the portfolio list
3. Click on it to view details

### Check the Database
1. Open your Supabase dashboard
2. Go to Table Editor → `companies`
3. Your company should appear in the list
4. Check the `founders` table for founder records

---

## 🎯 Key Concepts Learned

### Investment Workflow
- **Two-step process** separates auto-populated from manual fields
- **QuickPaste feature** speeds up data entry from external sources
- **Validation** ensures data quality before saving

### Data Structure
- **Companies and founders** are separate entities linked together
- **Investment terms** vary by instrument type (SAFE vs Equity)
- **Required fields** ensure minimum data quality

### Form Features
- **Auto-save** preserves your work as you type
- **Step validation** prevents incomplete submissions
- **Toast notifications** provide immediate feedback

---

## 🚀 What's Next?

Now that you've created your first investment, you can:

### Explore the Interface
- **Edit investments:** Try modifying the investment you just created
- **Portfolio management:** Explore filtering and search features
- **Founder management:** Practice adding and editing founder information

### Learn More
- **Understand the architecture:** [Architecture Overview](../explanation/architecture.md)
- **Dive into form validation:** [Form Validation](../how-to/form-validation.md)
- **Database management:** [Database Management](../how-to/database-management.md)

### Advanced Features
- **Set up monitoring:** [Deployment Guide](../how-to/deployment.md)
- **Customize forms:** [Form Validation Guide](../how-to/form-validation.md)

---

## 🚨 Troubleshooting

### Common Issues

**Form validation errors**
- Ensure all required fields (*) are filled
- Check email format for founder emails
- Verify numeric fields have valid amounts

**QuickPaste not working**
- Check console for parsing errors
- Ensure text format matches expected patterns
- Try manual entry if parsing fails

**Save failures**
- Check database connection in Supabase dashboard
- Verify environment variables are correct
- See [Troubleshooting Guide](../how-to/troubleshooting.md)

---

**Congratulations!** You've successfully created your first investment and learned the core workflow. 

Continue exploring or check out [Database Design](../explanation/database-design.md) to understand how the data is structured. 