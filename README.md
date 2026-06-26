# PBL Program Intelligence & Grant Reporting Assistant

A full-stack Next.js 14 application for education NGOs to transform school-level Project-Based Learning (PBL) survey data into review-ready decisions and grant-ready reports.

## Features

- **Program Dashboard**: View school-level PBL data, track participation rates, monitor attendance, and identify priority districts needing attention
- **Grant Reporting Assistant**: Generate grant reports with AI-powered narratives, view evidence galleries, and track performance metrics
- **Monthly Review Summary**: Structured monthly program review with achievements, month-over-month changes, risk analysis, and discussion points
- **Deterministic Risk Engine**: Pure function-based risk classification with no AI dependencies for core metrics
- **AI Narrative Generation**: Optional AI-powered report generation with graceful fallback to deterministic templates

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma ORM with SQLite
- **Charts**: Recharts
- **AI Integration**: OpenAI GPT-4o-mini (optional)
- **CSV Parsing**: csv-parse

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Data Files

Place the following CSV files in the `/data` directory:

**School Response Data:**
- `PBL_School_Response_Data_July_2025.csv`
- `PBL_School_Response_Data_August_2025.csv`
- `PBL_School_Response_Data_September_2025.csv`

**Grant Data:**
- `01_Grant_Profile_and_Finance.csv`
- `02_Grant_Performance_and_Report_Material.csv`
- `03_Evidence_and_Media_Index.csv`

Place the following image files in the `/public/images` directory:

**Evidence Images:**
- `student_project_activity_photo_01.png`
- `student_project_activity_photo_02.png`
- `student_project_activity_photo_03.png`
- `synthetic_news_clip_aa_sep_2025.png`
- `synthetic_news_clip_bb_sep_2025.png`
- `synthetic_news_clip_cc_sep_2025.png`
- `synthetic_student_recognition_aa_sep_2025.png`
- `synthetic_student_recognition_bb_sep_2025.png`
- `synthetic_student_recognition_cc_sep_2025.png`

### 3. Configure Environment

Copy the example environment file and add your OpenAI API key (optional):

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key if you want to use AI narrative generation:

```
OPENAI_API_KEY=your_actual_key_here
```

### 4. Initialize Database

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Seed Database

Import CSV data into the database:

```bash
npm run db:seed
```

**Note**: The seed script will fail with a clear error message if the `/data` directory is empty or if required CSV files are missing. This is intentional to prevent silent failures.

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture Overview

### Deterministic Engine vs AI Narrative Separation

The application is designed with a clear separation between deterministic calculations and AI-powered features:

**Deterministic Engine (`/lib/engine/`)**:
- Pure functions with zero side effects
- No AI calls or external dependencies
- Used for all core metrics and risk classification
- Can be audited and explained in technical interviews
- Functions: `riskEngine.ts`, `metrics.ts`, `priority.ts`

**AI Narrative Generation (`/app/api/narrative/`)**:
- Optional feature that can be toggled on/off
- Uses OpenAI GPT-4o-mini for report generation
- Gracefully degrades to deterministic template if AI fails or is disabled
- System prompt ensures AI only uses provided facts (no hallucinations)
- Returns source facts for traceability

This separation ensures:
- Core metrics are always reliable and deterministic
- AI features are optional and don't affect data integrity
- The system works perfectly without AI integration
- Easy to audit and explain the core logic

### Data Model

The application uses four Prisma models:

**SchoolResponse**: Individual school survey responses with PBL participation, evidence submission, enrollment, attendance, and derived risk status

**GrantFinance**: Grant budget and utilization tracking with budget lines, approved units, and cumulative utilization rates

**GrantPerformance**: Grant performance metrics including completion rates, evidence submission, attendance, and milestone summaries

**EvidenceMedia**: Links to evidence images and media with captions and usage notes

### Risk Classification Thresholds

The risk engine classifies performance into four categories based on completion/attendance rates:

- **On Track** (≥75%): Meeting expectations, no intervention needed
- **Behind** (60-74%): Below target but recoverable, monitor closely
- **At Risk** (35-59%): Significant gap, requires attention and support
- **Critical** (<35%): Severe underperformance, urgent intervention required

### API Routes

- `GET /api/schools`: Filtered school data with computed KPIs and month-over-month deltas
- `GET /api/filters`: Distinct values for filter dropdowns (months, districts, blocks, grades, subjects)
- `GET /api/grants`: Grant facts from performance, finance, and evidence media
- `POST /api/narrative`: Generate AI or deterministic narrative with source fact traceability

### Pages

- `/`: Landing page with navigation to all features
- `/dashboard`: Program dashboard with filters, KPIs, charts, and priority follow-up panel
- `/grants`: Grant reporting assistant with fact panel, evidence gallery, and AI narrative generator
- `/summary`: Monthly review summary with structured achievements, risks, and discussion points

## How AI Integration Works

### AI Narrative Generation

When AI is enabled in the Grant Reporting Assistant:

1. The system collects performance facts (completion rate, evidence rate, attendance rate, risk status, milestone summary)
2. It calls OpenAI GPT-4o-mini with a strict system prompt: "Write a 2-3 sentence report-ready summary using ONLY the facts provided. Never invent numbers, locations, achievements, or evidence not present in the input."
3. The AI generates a narrative based solely on the provided facts
4. The system returns both the narrative and the source facts used for traceability

### Graceful Degradation

If AI is disabled or fails for any reason:
- The system automatically falls back to a deterministic template
- Template: "In {reportingMonth}, {grantName} reached {pblCompletionRate}% PBL completion, {evidenceSubmissionRate}% evidence submission, and {attendanceRate}% attendance. Status: {riskStatus}."
- This ensures the application always works, with or without AI

## Known Limitations

- **SQLite for Development**: SQLite is used for quick setup and development. For production with concurrent writes, consider migrating to PostgreSQL
- **Manual Data Ingestion**: CSV files must be manually placed in the `/data` directory before seeding
- **Image File Management**: Evidence images must be manually placed in `/public/images` with exact filenames
- **Single User**: No authentication or role-based access control (RBAC) implemented
- **No Real-time Ingestion**: Data is batch-loaded via CSV seed script, not ingested in real-time

## Future Improvements

1. **Role-Based Access Control**: Implement authentication and RBAC to restrict access based on user roles (admin, program manager, field staff)

2. **Automated Report Scheduling**: Add scheduled jobs to automatically generate and email monthly reports to stakeholders

3. **Real-time Data Ingestion**: Build an API endpoint for schools to submit survey data directly, eliminating the need for CSV batch processing

4. **PostgreSQL Migration**: Migrate from SQLite to PostgreSQL for better concurrent write performance in production

5. **Advanced Analytics**: Add trend analysis, predictive modeling, and anomaly detection for early warning systems

6. **Mobile App**: Develop a mobile companion app for field staff to submit data and view dashboards on-the-go

## Development Notes

### Deterministic Engine Functions

The deterministic engine functions in `/lib/engine/` are designed to be:
- **Pure**: No side effects, only input → output
- **Well-documented**: Clear comments explaining the logic
- **Interview-ready**: Easy to explain and demonstrate in technical interviews
- **Testable**: Simple unit tests can verify correctness

### CSV Header Mapping

The seed script maps full question-text headers from CSV files to Prisma schema fields. For example:
- "What is the name of your district?" → `district`
- "Was the PBL project conducted in your school this month?" → `pblConducted`
- "Derived: Overall PBL attendance rate" → `attendanceRate`

The script handles "Not conducted", "Not applicable", and zero-value rows gracefully without crashing.

### Styling Approach

The application uses a clean, functional Tailwind CSS design:
- Neutral palette (slate/gray) for most UI elements
- Red/orange/yellow/green reserved only for risk indicators
- No unnecessary animations
- Focus on readability and data clarity

## Troubleshooting

### Seed Script Fails

If `npm run db:seed` fails:
1. Ensure all 6 CSV files are in the `/data` directory
2. Check that CSV filenames match exactly (case-sensitive)
3. Verify CSV headers match the expected format
4. The script will log a clear error message if files are missing

### AI Narrative Not Working

If AI narrative generation fails:
1. Check that `OPENAI_API_KEY` is set in `.env`
2. Verify the API key is valid and has credits
3. Toggle AI off to use the deterministic template
4. Check browser console for error messages

### Images Not Displaying

If evidence images don't display:
1. Ensure all 9 image files are in `/public/images`
2. Check that filenames match exactly
3. Verify image files are valid PNG format
4. The app shows a placeholder if images are missing

## License

This project is built for educational NGO use.

## Support

For issues or questions, please refer to the troubleshooting section or review the code comments in the deterministic engine files for detailed explanations of the logic.
