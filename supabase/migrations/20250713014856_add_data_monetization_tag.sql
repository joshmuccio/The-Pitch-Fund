-- Add data_monetization to business_model_tag enum
-- Date: July 13, 2025

BEGIN;

-- Add data_monetization to business_model_tag enum
ALTER TYPE business_model_tag ADD VALUE 'data_monetization';

COMMIT;
