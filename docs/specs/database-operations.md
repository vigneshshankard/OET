# Database Operations Manual

Version: 1.0  
Last Updated: September 21, 2025

## Overview

This document outlines essential database operations procedures for the OET Praxis platform, focusing on maintaining data integrity and performance.

## Backup Procedures

1. Full Database Backup
   - Frequency: Daily
   - Retention: 30 days
   - Time: 00:00 UTC
   - Type: Point-in-time recovery enabled

2. Transaction Log Backup
   - Frequency: Every 6 hours
   - Retention: 7 days

## Data Archival

1. Session Data
   - Archive after: 90 days
   - Storage: Cold storage
   - Retention: 1 year
   - Include: sessions, feedback_reports

2. Audit Logs
   - Archive after: 30 days
   - Storage: Cold storage
   - Retention: 2 years

## Table Partitioning

1. Sessions Table
   - Partition by: created_at (monthly)
   - Partition cleanup: After archival

2. Audit Logs
   - Partition by: timestamp (monthly)
   - Partition cleanup: After archival

## Maintenance Schedule

1. Index Maintenance
   - Frequency: Weekly
   - Time: Sunday 01:00 UTC
   - Operations: Rebuild and reorganize

2. Statistics Update
   - Frequency: Daily
   - Time: 23:00 UTC

## Implementation Notes

- Use native PostgreSQL tools
- Automate via cron jobs
- Monitor backup success/failure
- Test restore procedures monthly