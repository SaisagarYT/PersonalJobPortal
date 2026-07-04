# Backend Architecture

## Backend Flow

Data Sources <br>
↓ <br>
Scrapers<br>
↓<br>
Scheduler<br>
↓<br>
Storage<br>
↓<br>
API<br>
↓<br>
Dashboard<br>

## Models

1. User
2. Opportunity
3. Applied History
4. Category
5. Admin

## Database Integration

> Integrated Supabase to backend in the file <b>supabase.js</b> using the credentials demanded and connected the supabase postgresql locally using supabase connection string and session pooler (default IPV4) to the DataGrip IDE from Jetbrains.

<code>

    import { createClient } from '@supabase/supabase-js';


        // Create a single supabase client for interacting with your database

        const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')

</code>

## Infisical Integration

> The secrets are being handled by Infisical (third-party tool).

<code>

    import { InfisicalSDK } from '@infisical/sdk'

    const client = new InfisicalSDK({
    siteUrl: "your-infisical-instance.com" // Optional, defaults to https://app.infisical.com
    });

    // Authenticate with Infisical
    await client.auth().universalAuth.login({
    clientId: "<machine-identity-client-id>",
    clientSecret: "<machine-identity-client-secret>"
    });

    const allSecrets = await client.secrets().listSecrets({
    environment: "dev", // stg, dev, prod, or custom environment slugs
    projectId: "<your-project-id>"
    });

    console.log("Fetched secrets", allSecrets)

</code>

## Feature/unstop-scraper

- unstopFetchOpportunities (Filters -> role, userType, pagination)
- saveUnstopOpportunitiesInHistory (Saves the applied opportunity in history)
