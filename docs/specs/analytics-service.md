# Analytics Service Specification

Version: 1.0  
Last Updated: September 21, 2025

## Overview

This document specifies the analytics requirements for the OET Praxis platform, based on the data points defined in the database schema and user journeys documentation.

## 1. Data Collection Points

### 1.1 User Analytics
Based on user_progress_snapshots table from database-schema.md:
```json
{
  "user_metrics": {
    "sessions_completed": "number",
    "average_score": "float",
    "total_practice_time": "minutes",
    "last_active": "timestamp"
  }
}
```

### 1.2 Session Analytics
From sessions and feedback_reports tables:
```json
{
  "session_metrics": {
    "duration_seconds": "number",
    "scenario_id": "uuid",
    "completion_status": "string",
    "score_raw": "number",
    "timestamp": "ISO8601"
  }
}
```

### 1.3 Content Analytics
Based on scenarios table:
```json
{
  "content_metrics": {
    "usage_count": "number",
    "average_completion_time": "seconds",
    "average_score": "float",
    "difficulty_level": "string"
  }
}
```

## 2. Data Processing

### 2.1 Aggregation Rules
Daily aggregations as specified in user_progress_snapshots:
- User performance metrics
- Session completion rates
- Content usage statistics

### 2.2 Processing Intervals
- Real-time metrics: Session data
- Daily aggregations: User progress
- Weekly aggregations: Content performance
- Monthly aggregations: Business metrics

## 3. Storage Requirements

### 3.1 Raw Data
Using existing database tables:
- sessions
- feedback_reports
- user_progress_snapshots

### 3.2 Aggregated Data
Based on database-schema.md:
```sql
CREATE TABLE analytics_aggregates (
    id UUID PRIMARY KEY,
    metric_type VARCHAR(50),
    time_bucket TIMESTAMP,
    data JSONB,
    created_at TIMESTAMP
);
```

## 4. API Endpoints

From api-specification.md admin analytics endpoint:
```http
GET /admin/analytics/users
Query Parameters:
- startDate (string)
- endDate (string)
- metric (string)
```

## 5. Report Types

### 5.1 User Reports
- Session completion trends
- Score progression
- Time spent practicing
- Strength areas

### 5.2 Content Reports
- Popular scenarios
- Completion rates
- Average scores
- Time distribution

### 5.3 Business Reports
- Active users
- Subscription metrics
- Usage patterns
- Retention rates

## 6. Implementation Notes

1. Use existing database tables
2. Implement aggregations using SQL
3. No real-time analytics engine needed
4. Use simple CSV exports
5. Basic visualizations only

## 7. Limitations

- No custom report builder
- No advanced analytics
- No machine learning features
- No external data imports
- No raw data exports