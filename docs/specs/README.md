# OET Praxis Technical Specifications

Version: 1.0  
Last Updated: September 21, 2025

## Overview

This folder contains the complete technical specifications for the OET Praxis platform, an AI-powered speaking practice environment for healthcare professionals preparing for the OET exam. These specifications serve as the single source of truth for development and should be followed precisely to ensure consistent implementation.

## Document Structure

This specification is divided into several key documents, each focusing on a specific aspect of the system:

1. [`system-architecture.md`](./system-architecture.md)
   - System components and their interactions
   - Technology stack details
   - Infrastructure specifications
   - Third-party service integrations

2. [`database-schema.md`](./database-schema.md)
   - Complete database schema
   - Table relationships
   - Field definitions and constraints
   - Data migration guidelines

3. [`user-journeys.md`](./user-journeys.md)
   - Detailed user flows
   - Interface specifications
   - User interaction patterns
   - Journey maps and flowcharts

4. [`api-specification.md`](./api-specification.md)
   - API endpoint definitions
   - Request/response formats
   - Authentication and authorization
   - Rate limiting and security measures

5. [`ai-components.md`](./ai-components.md)
   - LLM integration specifications
   - Speech processing pipeline
   - Feedback generation system
   - AI guardrails and safety measures

## Traceability Matrix

Each specification in these documents maps back to specific requirements in the Product Requirements Document (PRD v1.1, dated May 11, 2024). The traceability is maintained through explicit references to PRD sections in each specification document.

## Version Control

All changes to these specifications must be:
1. Reviewed and approved by the technical lead
2. Documented in the change log of each affected file
3. Accompanied by updates to the version number if substantial

## Implementation Guidelines

1. These specifications should be treated as the definitive reference for implementation
2. Any ambiguities or conflicts should be raised and resolved before implementation
3. Deviations from these specifications require explicit approval and documentation

## Contribution Guidelines

When contributing to these specifications:
1. Follow the established Markdown formatting
2. Include Mermaid diagrams for visual representations
3. Maintain consistent terminology throughout
4. Update the traceability matrix when adding new specifications

## Questions and Clarifications

For any questions or clarifications regarding these specifications, please:
1. Open an issue in the repository
2. Reference the specific document and section
3. Provide context for the question or clarification needed