-- Migration: Migrate Existing Tags to Standardized Format
-- Date: 2025-01-09
-- Description: Clean up and normalize existing industry and business model tags, and migrate keywords

-- First, let's check if the companies table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    RAISE NOTICE 'Companies table does not exist, skipping tag migration';
    RETURN;
  END IF;
END $$;

-- Remove existing constraints temporarily (if they exist)
ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_industry_tags_valid;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_business_model_tags_valid;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_keywords_valid;

-- Create a mapping table for tag normalization
CREATE TEMP TABLE tag_mapping AS
SELECT 
  original_tag,
  standardized_tag,
  tag_type
FROM (VALUES
  -- Industry tag mappings
  ('fintech', 'fintech', 'industry'),
  ('fin-tech', 'fintech', 'industry'),
  ('financial technology', 'fintech', 'industry'),
  ('financial_technology', 'fintech', 'industry'),
  ('finance', 'fintech', 'industry'),
  ('edtech', 'edtech', 'industry'),
  ('ed-tech', 'edtech', 'industry'),
  ('education technology', 'edtech', 'industry'),
  ('education', 'edtech', 'industry'),
  ('healthtech', 'healthtech', 'industry'),
  ('health-tech', 'healthtech', 'industry'),
  ('health technology', 'healthtech', 'industry'),
  ('healthcare', 'healthtech', 'industry'),
  ('health', 'healthtech', 'industry'),
  ('medical', 'healthtech', 'industry'),
  ('foodtech', 'foodtech', 'industry'),
  ('food-tech', 'foodtech', 'industry'),
  ('food technology', 'foodtech', 'industry'),
  ('food', 'foodtech', 'industry'),
  ('ecommerce', 'e_commerce', 'industry'),
  ('e-commerce', 'e_commerce', 'industry'),
  ('e_commerce', 'e_commerce', 'industry'),
  ('commerce', 'e_commerce', 'industry'),
  ('retail', 'retail', 'industry'),
  ('consumer', 'consumer', 'industry'),
  ('mobile', 'mobile', 'industry'),
  ('cloud', 'cloud', 'industry'),
  ('defi', 'defi', 'industry'),
  ('decentralized finance', 'defi', 'industry'),
  ('nft', 'nft', 'industry'),
  ('non-fungible token', 'nft', 'industry'),
  ('gaming', 'gaming', 'industry'),
  ('games', 'gaming', 'industry'),
  ('video games', 'gaming', 'industry'),
  ('esports', 'gaming', 'industry'),
  ('entertainment', 'media_entertainment', 'industry'),
  ('media', 'media_entertainment', 'industry'),
  ('content', 'media_entertainment', 'industry'),
  ('productivity', 'productivity', 'industry'),
  ('communication', 'communication', 'industry'),
  ('logistics', 'logistics', 'industry'),
  ('supply chain', 'supply_chain', 'industry'),
  ('supply_chain', 'supply_chain', 'industry'),
  ('transportation', 'transportation', 'industry'),
  ('travel', 'travel', 'industry'),
  ('hospitality', 'hospitality', 'industry'),
  ('real estate', 'real_estate', 'industry'),
  ('real_estate', 'real_estate', 'industry'),
  ('proptech', 'proptech', 'industry'),
  ('prop-tech', 'proptech', 'industry'),
  ('property technology', 'proptech', 'industry'),
  ('construction', 'construction', 'industry'),
  ('manufacturing', 'manufacturing', 'industry'),
  ('energy', 'energy', 'industry'),
  ('cleantech', 'cleantech', 'industry'),
  ('clean-tech', 'cleantech', 'industry'),
  ('clean technology', 'cleantech', 'industry'),
  ('sustainability', 'greentech_sustainability', 'industry'),
  ('greentech', 'greentech_sustainability', 'industry'),
  ('green tech', 'greentech_sustainability', 'industry'),
  ('green_tech', 'greentech_sustainability', 'industry'),
  ('sustainable', 'greentech_sustainability', 'industry'),
  ('green', 'greentech_sustainability', 'industry'),
  ('climate tech', 'greentech_sustainability', 'industry'),
  ('climate_tech', 'greentech_sustainability', 'industry'),
  ('environmental', 'greentech_sustainability', 'industry'),
  ('fitness', 'fitness', 'industry'),
  ('wellness', 'wellness', 'industry'),
  ('mental health', 'mental_health', 'industry'),
  ('mental_health', 'mental_health', 'industry'),
  ('fashion', 'fashion_beauty', 'industry'),
  ('beauty', 'fashion_beauty', 'industry'),
  ('cosmetics', 'fashion_beauty', 'industry'),
  ('apparel', 'fashion_beauty', 'industry'),
  ('clothing', 'fashion_beauty', 'industry'),
  ('skincare', 'fashion_beauty', 'industry'),
  ('makeup', 'fashion_beauty', 'industry'),
  ('cpg', 'cpg', 'industry'),
  ('consumer packaged goods', 'cpg', 'industry'),
  ('consumer_packaged_goods', 'cpg', 'industry'),
  ('packaged goods', 'cpg', 'industry'),
  ('packaged_goods', 'cpg', 'industry'),
  ('fmcg', 'cpg', 'industry'),
  ('fast moving consumer goods', 'cpg', 'industry'),
  ('pets', 'pets', 'industry'),
  ('pet', 'pets', 'industry'),
  ('agriculture', 'agriculture', 'industry'),
  ('farming', 'farming', 'industry'),
  ('agtech', 'agtech', 'industry'),
  ('ag-tech', 'agtech', 'industry'),
  ('agriculture technology', 'agtech', 'industry'),
  ('cybersecurity', 'cybersecurity', 'industry'),
  ('cyber security', 'cybersecurity', 'industry'),
  ('cyber-security', 'cybersecurity', 'industry'),
  ('security', 'cybersecurity', 'industry'),
  ('insurtech', 'insurtech', 'industry'),
  ('insur-tech', 'insurtech', 'industry'),
  ('insurance technology', 'insurtech', 'industry'),
  ('insurance', 'insurtech', 'industry'),
  ('legaltech', 'legaltech', 'industry'),
  ('legal-tech', 'legaltech', 'industry'),
  ('legal technology', 'legaltech', 'industry'),
  ('legal', 'legaltech', 'industry'),
  ('hrtech', 'hrtech', 'industry'),
  ('hr-tech', 'hrtech', 'industry'),
  ('human resources technology', 'hrtech', 'industry'),
  ('hr', 'hrtech', 'industry'),
  ('human resources', 'hrtech', 'industry'),
  ('martech', 'martech', 'industry'),
  ('mar-tech', 'martech', 'industry'),
  ('marketing technology', 'martech', 'industry'),
  ('marketing', 'martech', 'industry'),
  ('adtech', 'adtech', 'industry'),
  ('ad-tech', 'adtech', 'industry'),
  ('advertising technology', 'adtech', 'industry'),
  ('advertising', 'adtech', 'industry'),
  ('regtech', 'regtech', 'industry'),
  ('reg-tech', 'regtech', 'industry'),
  ('regulatory technology', 'regtech', 'industry'),
  ('compliance', 'regtech', 'industry'),
  ('iot', 'iot', 'industry'),
  ('internet of things', 'iot', 'industry'),
  ('internet_of_things', 'iot', 'industry'),
  ('IoT', 'iot', 'industry'),
  ('robotics', 'robotics', 'industry'),
  ('robots', 'robotics', 'industry'),
  ('ar', 'ar_vr', 'industry'),
  ('vr', 'ar_vr', 'industry'),
  ('augmented reality', 'ar_vr', 'industry'),
  ('virtual reality', 'ar_vr', 'industry'),
  ('mixed reality', 'ar_vr', 'industry'),
  ('xr', 'ar_vr', 'industry'),
  ('space', 'space', 'industry'),
  ('aerospace', 'space', 'industry'),
  ('defense', 'defense', 'industry'),
  ('government', 'government', 'industry'),
  ('gov', 'government', 'industry'),
  ('public sector', 'public_sector', 'industry'),
  ('public_sector', 'public_sector', 'industry'),
  ('video', 'media_entertainment', 'industry'),
  ('audio', 'media_entertainment', 'industry'),
  ('podcast', 'media_entertainment', 'industry'),
  ('music', 'media_entertainment', 'industry'),
  ('streaming', 'media_entertainment', 'industry'),
  ('sports', 'sports', 'industry'),
  ('esports', 'sports', 'industry'),
  ('publishing', 'media_entertainment', 'industry'),
  ('books', 'media_entertainment', 'industry'),
  ('news', 'media_entertainment', 'industry'),
  ('journalism', 'media_entertainment', 'industry'),
  ('parenting', 'parenting', 'industry'),
  ('parents', 'parenting', 'industry'),
  ('family', 'parenting', 'industry'),
  ('kids', 'parenting', 'industry'),
  ('children', 'parenting', 'industry'),
  ('seniors', 'seniors', 'industry'),
  ('elderly', 'seniors', 'industry'),
  ('disability', 'disability', 'industry'),
  ('accessibility', 'accessibility', 'industry'),
  ('diversity', 'diversity', 'industry'),
  ('inclusion', 'inclusion', 'industry'),
  ('gig economy', 'gig_economy', 'industry'),
  ('gig_economy', 'gig_economy', 'industry'),
  ('freelance', 'freelance', 'industry'),
  ('freelancing', 'freelance', 'industry'),
  ('remote work', 'remote_work', 'industry'),
  ('remote_work', 'remote_work', 'industry'),
  ('future of work', 'future_of_work', 'industry'),
  ('future_of_work', 'future_of_work', 'industry'),
  ('work', 'future_of_work', 'industry'),
  ('employment', 'future_of_work', 'industry'),
  ('biotech', 'biotech', 'industry'),
  ('bio-tech', 'biotech', 'industry'),
  ('biotechnology', 'biotech', 'industry'),
  ('biology', 'biotech', 'industry'),
  ('pharma', 'pharma', 'industry'),
  ('pharmaceutical', 'pharma', 'industry'),
  ('pharmaceuticals', 'pharma', 'industry'),
  ('drugs', 'pharma', 'industry'),
  ('medicine', 'pharma', 'industry'),
  ('medical devices', 'medical_devices', 'industry'),
  ('medical_devices', 'medical_devices', 'industry'),
  ('diagnostics', 'diagnostics', 'industry'),
  ('diagnosis', 'diagnostics', 'industry'),
  ('telemedicine', 'telemedicine', 'industry'),
  ('telehealth', 'telemedicine', 'industry'),
  ('digital health', 'digital_health', 'industry'),
  ('digital_health', 'digital_health', 'industry'),
  ('developer', 'developer', 'industry'),
  ('creator', 'creator', 'industry'),
  ('influencer', 'influencer', 'industry'),
  ('small business', 'small_business', 'industry'),
  ('small_business', 'small_business', 'industry'),
  ('smb', 'smb', 'industry'),
  ('solopreneur', 'solopreneur', 'industry'),
  ('freelancer', 'freelancer', 'industry'),
  ('remote worker', 'remote_worker', 'industry'),
  ('remote_worker', 'remote_worker', 'industry'),
  ('genz', 'genz', 'industry'),
  ('gen z', 'genz', 'industry'),
  ('generation z', 'genz', 'industry'),
  ('millennials', 'millennials', 'industry'),
  ('millennial', 'millennials', 'industry'),
  ('students', 'students', 'industry'),
  ('student', 'students', 'industry'),
  ('professionals', 'professionals', 'industry'),
  ('professional', 'professionals', 'industry'),
  ('healthcare providers', 'healthcare_providers', 'industry'),
  ('healthcare_providers', 'healthcare_providers', 'industry'),
  ('doctors', 'healthcare_providers', 'industry'),
  ('physicians', 'healthcare_providers', 'industry'),
  ('nurses', 'healthcare_providers', 'industry'),
  ('financial advisors', 'financial_advisors', 'industry'),
  ('financial_advisors', 'financial_advisors', 'industry'),
  ('advisors', 'financial_advisors', 'industry'),
  ('real estate agents', 'real_estate_agents', 'industry'),
  ('real_estate_agents', 'real_estate_agents', 'industry'),
  ('restaurants', 'restaurants', 'industry'),
  ('restaurant', 'restaurants', 'industry'),
  ('food service', 'restaurants', 'industry'),
  ('food_service', 'restaurants', 'industry'),
  ('retailers', 'retailers', 'industry'),
  ('retailer', 'retailers', 'industry'),
  ('manufacturers', 'manufacturers', 'industry'),
  ('manufacturer', 'manufacturers', 'industry'),
  ('logistics providers', 'logistics_providers', 'industry'),
  ('logistics_providers', 'logistics_providers', 'industry'),
  ('shipping', 'logistics_providers', 'industry'),
  ('delivery', 'logistics_providers', 'industry'),
  ('fulfillment', 'logistics_providers', 'industry'),
  
  -- New Technology & Software industry tags
  ('hardware', 'hardware', 'industry'),
  ('physical products', 'hardware', 'industry'),
  ('consumer electronics', 'hardware', 'industry'),
  ('electronics', 'hardware', 'industry'),
  ('devices', 'hardware', 'industry'),
  ('ev tech', 'ev_tech', 'industry'),
  ('ev_tech', 'ev_tech', 'industry'),
  ('electric vehicle', 'ev_tech', 'industry'),
  ('electric vehicles', 'ev_tech', 'industry'),
  ('electric_vehicle', 'ev_tech', 'industry'),
  ('electric_vehicles', 'ev_tech', 'industry'),
  ('ev', 'ev_tech', 'industry'),
  ('battery tech', 'ev_tech', 'industry'),
  ('battery_tech', 'ev_tech', 'industry'),
  ('charging infrastructure', 'ev_tech', 'industry'),
  ('vertical saas', 'vertical_saas', 'industry'),
  ('vertical_saas', 'vertical_saas', 'industry'),
  ('industry specific saas', 'vertical_saas', 'industry'),
  ('vertical software', 'vertical_saas', 'industry'),
  ('vertical ai', 'vertical_saas', 'industry'),
  ('vertical_ai', 'vertical_saas', 'industry'),
  ('agentic ai', 'agentic_ai', 'industry'),
  ('agentic_ai', 'agentic_ai', 'industry'),
  ('ai agents', 'agentic_ai', 'industry'),
  ('ai_agents', 'agentic_ai', 'industry'),
  ('autonomous ai', 'agentic_ai', 'industry'),
  ('autonomous_ai', 'agentic_ai', 'industry'),
  ('deeptech', 'deeptech', 'industry'),
  ('deep tech', 'deeptech', 'industry'),
  ('deep_tech', 'deeptech', 'industry'),
  ('advanced technology', 'deeptech', 'industry'),
  ('frontier tech', 'deeptech', 'industry'),
  ('frontier_tech', 'deeptech', 'industry'),
  
  -- New general industry tags
  ('food beverage', 'food_beverage', 'industry'),
  ('food_beverage', 'food_beverage', 'industry'),
  ('food and beverage', 'food_beverage', 'industry'),
  ('food & beverage', 'food_beverage', 'industry'),
  ('food & bev', 'food_beverage', 'industry'),
  ('beverage', 'food_beverage', 'industry'),
  ('beverages', 'food_beverage', 'industry'),
  ('drinks', 'food_beverage', 'industry'),
  ('alcohol', 'food_beverage', 'industry'),
  ('restaurant industry', 'food_beverage', 'industry'),
  ('culinary', 'food_beverage', 'industry'),
  
  -- Business model tag mappings (revenue models and business types only)
  ('marketplace', 'marketplace', 'business_model'),
  ('platform', 'platform', 'business_model'),
  ('saas', 'saas', 'business_model'),
  ('software as a service', 'saas', 'business_model'),
  ('software-as-a-service', 'saas', 'business_model'),
  ('social network', 'social_network', 'business_model'),
  ('social_network', 'social_network', 'business_model'),
  ('social media', 'social_network', 'business_model'),
  ('social_media', 'social_network', 'business_model'),
  ('social', 'social_network', 'business_model'),
  ('subscription', 'subscription', 'business_model'),
  ('recurring', 'subscription', 'business_model'),
  ('freemium', 'freemium', 'business_model'),
  ('two-sided marketplace', 'two_sided_marketplace', 'business_model'),
  ('two_sided_marketplace', 'two_sided_marketplace', 'business_model'),
  ('multi-sided platform', 'multi_sided_platform', 'business_model'),
  ('multi_sided_platform', 'multi_sided_platform', 'business_model'),
  ('transaction fee', 'transaction_fee', 'business_model'),
  ('transaction_fee', 'transaction_fee', 'business_model'),
  ('commission', 'commission', 'business_model'),
  ('advertising', 'advertising', 'business_model'),
  ('ads', 'advertising', 'business_model'),
  ('sponsored content', 'sponsored_content', 'business_model'),
  ('sponsored_content', 'sponsored_content', 'business_model'),
  ('affiliate', 'affiliate', 'business_model'),
  ('licensing', 'licensing', 'business_model'),
  ('license', 'licensing', 'business_model'),
  ('white label', 'white_label', 'business_model'),
  ('white_label', 'white_label', 'business_model'),
  ('franchise', 'franchise', 'business_model'),
  ('one time purchase', 'one_time_purchase', 'business_model'),
  ('one_time_purchase', 'one_time_purchase', 'business_model'),
  ('usage based', 'usage_based', 'business_model'),
  ('usage_based', 'usage_based', 'business_model'),
  ('pay per use', 'pay_per_use', 'business_model'),
  ('pay_per_use', 'pay_per_use', 'business_model'),
  ('aggregator', 'aggregator', 'business_model'),
  ('direct to consumer', 'direct_to_consumer', 'business_model'),
  ('direct_to_consumer', 'direct_to_consumer', 'business_model'),
  ('d2c', 'd2c', 'business_model'),
  ('dtc', 'd2c', 'business_model'),
  ('peer to peer', 'peer_to_peer', 'business_model'),
  ('peer_to_peer', 'peer_to_peer', 'business_model'),
  ('p2p', 'p2p', 'business_model'),
  ('social commerce', 'social_commerce', 'business_model'),
  ('social_commerce', 'social_commerce', 'business_model'),
  ('live commerce', 'live_commerce', 'business_model'),
  ('live_commerce', 'live_commerce', 'business_model'),
  ('group buying', 'group_buying', 'business_model'),
  ('group_buying', 'group_buying', 'business_model'),
  ('subscription commerce', 'subscription_commerce', 'business_model'),
  ('subscription_commerce', 'subscription_commerce', 'business_model'),
  ('b2b', 'b2b', 'business_model'),
  ('b2c', 'b2c', 'business_model'),
  ('b2b2c', 'b2b2c', 'business_model'),
  ('business to business', 'b2b', 'business_model'),
  ('business_to_business', 'b2b', 'business_model'),
  ('business to consumer', 'b2c', 'business_model'),
  ('business_to_consumer', 'b2c', 'business_model'),
  ('B2B', 'b2b', 'business_model'),
  ('B2C', 'b2c', 'business_model'),
  ('B2B2C', 'b2b2c', 'business_model'),
  ('SaaS', 'saas', 'business_model'),
  ('SAAS', 'saas', 'business_model'),
  
  -- Keyword tag mappings (delivery models and technology approaches)
  ('ai', 'ai', 'keyword'),
  ('artificial intelligence', 'ai', 'keyword'),
  ('artificial_intelligence', 'ai', 'keyword'),
  ('AI', 'ai', 'keyword'),
  ('machine learning', 'machine_learning', 'keyword'),
  ('machine_learning', 'machine_learning', 'keyword'),
  ('ml', 'machine_learning', 'keyword'),
  ('ML', 'machine_learning', 'keyword'),
  ('api', 'api', 'keyword'),
  ('API', 'api', 'keyword'),
  ('developer tools', 'developer_tools', 'keyword'),
  ('developer_tools', 'developer_tools', 'keyword'),
  ('devtools', 'developer_tools', 'keyword'),
  ('blockchain', 'blockchain', 'keyword'),
  ('crypto', 'crypto', 'keyword'),
  ('cryptocurrency', 'crypto', 'keyword'),
  ('web3', 'web3', 'keyword'),
  ('web 3', 'web3', 'keyword'),
  ('web3.0', 'web3', 'keyword'),
  ('infrastructure', 'infrastructure', 'keyword'),
  ('web', 'web_based', 'keyword'),
  ('automation', 'automation', 'keyword'),
  ('automated', 'automation', 'keyword'),
  ('on demand', 'on_demand', 'keyword'),
  ('on_demand', 'on_demand', 'keyword'),
  ('on-demand', 'on_demand', 'keyword'),
  ('instant delivery', 'instant_delivery', 'keyword'),
  ('instant_delivery', 'instant_delivery', 'keyword'),
  ('scheduled delivery', 'scheduled_delivery', 'keyword'),
  ('scheduled_delivery', 'scheduled_delivery', 'keyword'),
  ('pickup', 'pickup', 'keyword'),
  ('curbside', 'curbside', 'keyword'),
  ('in store', 'in_store', 'keyword'),
  ('in_store', 'in_store', 'keyword'),
  ('in-store', 'in_store', 'keyword'),
  ('online only', 'online_only', 'keyword'),
  ('online_only', 'online_only', 'keyword'),
  ('online-only', 'online_only', 'keyword'),
  ('omnichannel', 'omnichannel', 'keyword'),
  ('omni-channel', 'omnichannel', 'keyword'),
  ('mobile first', 'mobile_first', 'keyword'),
  ('mobile_first', 'mobile_first', 'keyword'),
  ('mobile-first', 'mobile_first', 'keyword'),
  ('web based', 'web_based', 'keyword'),
  ('web_based', 'web_based', 'keyword'),
  ('web-based', 'web_based', 'keyword'),
  ('native app', 'native_app', 'keyword'),
  ('native_app', 'native_app', 'keyword'),
  ('progressive web app', 'progressive_web_app', 'keyword'),
  ('progressive_web_app', 'progressive_web_app', 'keyword'),
  ('pwa', 'progressive_web_app', 'keyword'),
  ('api first', 'api_first', 'keyword'),
  ('api_first', 'api_first', 'keyword'),
  ('api-first', 'api_first', 'keyword'),
  ('headless', 'headless', 'keyword'),
  ('no code', 'no_code', 'keyword'),
  ('no_code', 'no_code', 'keyword'),
  ('no-code', 'no_code', 'keyword'),
  ('nocode', 'no_code', 'keyword'),
  ('low code', 'low_code', 'keyword'),
  ('low_code', 'low_code', 'keyword'),
  ('low-code', 'low_code', 'keyword'),
  ('lowcode', 'low_code', 'keyword'),
  ('self service', 'self_service', 'keyword'),
  ('self_service', 'self_service', 'keyword'),
  ('self-service', 'self_service', 'keyword'),
  ('self serve', 'self_service', 'keyword'),
  ('self_serve', 'self_service', 'keyword'),
  ('self-serve', 'self_service', 'keyword'),
  ('managed service', 'managed_service', 'keyword'),
  ('managed_service', 'managed_service', 'keyword'),
  ('white glove', 'white_glove', 'keyword'),
  ('white_glove', 'white_glove', 'keyword'),
  ('do it yourself', 'do_it_yourself', 'keyword'),
  ('do_it_yourself', 'do_it_yourself', 'keyword'),
  ('diy', 'do_it_yourself', 'keyword'),
  ('do it for you', 'do_it_for_you', 'keyword'),
  ('do_it_for_you', 'do_it_for_you', 'keyword'),
  ('dify', 'do_it_for_you', 'keyword'),
  ('do it with you', 'do_it_with_you', 'keyword'),
  ('do_it_with_you', 'do_it_with_you', 'keyword'),
  ('diwy', 'do_it_with_you', 'keyword'),
  ('ai powered', 'ai_powered', 'keyword'),
  ('ai_powered', 'ai_powered', 'keyword'),
  ('ai-powered', 'ai_powered', 'keyword'),
  ('workflow automation', 'workflow_automation', 'keyword'),
  ('workflow_automation', 'workflow_automation', 'keyword'),
  ('robotic process automation', 'robotic_process_automation', 'keyword'),
  ('robotic_process_automation', 'robotic_process_automation', 'keyword'),
  ('rpa', 'robotic_process_automation', 'keyword'),
  ('intelligent automation', 'intelligent_automation', 'keyword'),
  ('intelligent_automation', 'intelligent_automation', 'keyword'),
  ('predictive analytics', 'predictive_analytics', 'keyword'),
  ('predictive_analytics', 'predictive_analytics', 'keyword'),
  ('real time analytics', 'real_time_analytics', 'keyword'),
  ('real_time_analytics', 'real_time_analytics', 'keyword'),
  ('real-time analytics', 'real_time_analytics', 'keyword'),
  ('personalization', 'personalization', 'keyword'),
  ('personalized', 'personalization', 'keyword'),
  ('recommendation engine', 'recommendation_engine', 'keyword'),
  ('recommendation_engine', 'recommendation_engine', 'keyword'),
  ('recommendations', 'recommendation_engine', 'keyword'),
  ('matching algorithm', 'matching_algorithm', 'keyword'),
  ('matching_algorithm', 'matching_algorithm', 'keyword'),
  ('matching', 'matching_algorithm', 'keyword'),
  ('optimization', 'optimization', 'keyword'),
  ('optimized', 'optimization', 'keyword'),
  ('integration platform', 'integration_platform', 'keyword'),
  ('integration_platform', 'integration_platform', 'keyword'),
  ('connector', 'connector', 'keyword'),
  ('connectors', 'connector', 'keyword'),
  ('middleware', 'middleware', 'keyword'),
  ('api platform', 'api_platform', 'keyword'),
  ('api_platform', 'api_platform', 'keyword'),
  ('microservices', 'microservices', 'keyword'),
  ('micro-services', 'microservices', 'keyword'),
  ('serverless', 'serverless', 'keyword'),
  ('server-less', 'serverless', 'keyword'),
  ('edge computing', 'edge_computing', 'keyword'),
  ('edge_computing', 'edge_computing', 'keyword'),
  ('distributed system', 'distributed_system', 'keyword'),
  ('distributed_system', 'distributed_system', 'keyword'),
  ('decentralized', 'decentralized', 'keyword'),
  ('blockchain based', 'blockchain_based', 'keyword'),
  ('blockchain_based', 'blockchain_based', 'keyword'),
  ('blockchain-based', 'blockchain_based', 'keyword'),
  ('smart contracts', 'smart_contracts', 'keyword'),
  ('smart_contracts', 'smart_contracts', 'keyword'),
  ('tokenization', 'tokenization', 'keyword'),
  ('tokenized', 'tokenization', 'keyword'),
  ('nft', 'nft', 'keyword'),
  ('non-fungible token', 'nft', 'keyword'),
  ('defi', 'defi', 'keyword'),
  ('decentralized finance', 'defi', 'keyword'),
  ('web3', 'web3', 'keyword'),
  ('web 3', 'web3', 'keyword'),
  ('web3.0', 'web3', 'keyword'),
  ('metaverse', 'metaverse', 'keyword'),
  ('virtual reality', 'virtual_reality', 'keyword'),
  ('virtual_reality', 'virtual_reality', 'keyword'),
  ('vr', 'virtual_reality', 'keyword'),
  ('augmented reality', 'augmented_reality', 'keyword'),
  ('augmented_reality', 'augmented_reality', 'keyword'),
  ('ar', 'augmented_reality', 'keyword'),
  ('mixed reality', 'mixed_reality', 'keyword'),
  ('mixed_reality', 'mixed_reality', 'keyword'),
  ('mr', 'mixed_reality', 'keyword'),
  ('spatial computing', 'spatial_computing', 'keyword'),
  
  -- Additional growth and strategy keywords
  ('product market fit', 'product_market_fit', 'keyword'),
  ('product_market_fit', 'product_market_fit', 'keyword'),
  ('pmf', 'product_market_fit', 'keyword'),
  ('founder market fit', 'founder_market_fit', 'keyword'),
  ('founder_market_fit', 'founder_market_fit', 'keyword'),
  ('fmf', 'founder_market_fit', 'keyword'),
  ('minimum viable product', 'minimum_viable_product', 'keyword'),
  ('minimum_viable_product', 'minimum_viable_product', 'keyword'),
  ('mvp', 'minimum_viable_product', 'keyword'),
  ('pivot', 'pivot', 'keyword'),
  ('pivoted', 'pivot', 'keyword'),
  ('bootstrapped', 'bootstrapped', 'keyword'),
  ('bootstrap', 'bootstrapped', 'keyword'),
  ('self funded', 'bootstrapped', 'keyword'),
  ('self_funded', 'bootstrapped', 'keyword'),
  ('viral growth', 'viral_growth', 'keyword'),
  ('viral_growth', 'viral_growth', 'keyword'),
  ('viral', 'viral_growth', 'keyword'),
  ('flywheel effect', 'flywheel_effect', 'keyword'),
  ('flywheel_effect', 'flywheel_effect', 'keyword'),
  ('flywheel', 'flywheel_effect', 'keyword'),
  ('lean startup', 'lean_startup', 'keyword'),
  ('lean_startup', 'lean_startup', 'keyword'),
  ('lean', 'lean_startup', 'keyword'),
  ('enterprise sales', 'enterprise_sales', 'keyword'),
  ('enterprise_sales', 'enterprise_sales', 'keyword'),
  ('product led growth', 'product_led_growth', 'keyword'),
  ('product_led_growth', 'product_led_growth', 'keyword'),
  ('plg', 'product_led_growth', 'keyword'),
  ('sales led growth', 'sales_led_growth', 'keyword'),
  ('sales_led_growth', 'sales_led_growth', 'keyword'),
  ('community led growth', 'community_led_growth', 'keyword'),
  ('community_led_growth', 'community_led_growth', 'keyword'),
  ('network effects', 'network_effects', 'keyword'),
  ('network_effects', 'network_effects', 'keyword'),
  ('disintermediation', 'disintermediation', 'keyword'),
  
  -- Additional AI and technology keywords
  ('deep learning', 'deep_learning', 'keyword'),
  ('deep_learning', 'deep_learning', 'keyword'),
  ('dl', 'deep_learning', 'keyword'),
  ('natural language processing', 'natural_language_processing', 'keyword'),
  ('natural_language_processing', 'natural_language_processing', 'keyword'),
  ('nlp', 'nlp', 'keyword'),
  ('language processing', 'natural_language_processing', 'keyword'),
  ('computer vision', 'computer_vision', 'keyword'),
  ('computer_vision', 'computer_vision', 'keyword'),
  ('cv', 'computer_vision', 'keyword'),
  ('image recognition', 'computer_vision', 'keyword'),
  ('generative ai', 'generative_ai', 'keyword'),
  ('generative_ai', 'generative_ai', 'keyword'),
  ('gen ai', 'generative_ai', 'keyword'),
  ('genai', 'generative_ai', 'keyword'),
  ('3d printing', '3d_printing', 'keyword'),
  ('3d_printing', '3d_printing', 'keyword'),
  ('additive manufacturing', '3d_printing', 'keyword'),
  ('big data', 'big_data', 'keyword'),
  ('big_data', 'big_data', 'keyword'),
  ('large datasets', 'big_data', 'keyword'),
  ('data processing', 'big_data', 'keyword')
) AS mapping(original_tag, standardized_tag, tag_type);

-- Function to normalize a single tag
CREATE OR REPLACE FUNCTION normalize_tag(input_tag text, tag_type text) 
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  -- Clean the input tag
  input_tag := trim(lower(input_tag));
  
  -- Try to find exact match in mapping
  SELECT standardized_tag INTO result
  FROM tag_mapping tm
  WHERE tm.original_tag = input_tag AND tm.tag_type = tag_type;
  
  IF result IS NOT NULL THEN
    RETURN result;
  END IF;
  
  -- If no exact match, try to find partial matches or return original
  -- This handles cases where the tag might be valid but not in our mapping
  RETURN input_tag;
END;
$$ LANGUAGE plpgsql;

-- Update existing industry tags (only if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'industry_tags') THEN
    UPDATE companies 
    SET industry_tags = (
      SELECT ARRAY(
        SELECT DISTINCT normalize_tag(trim(tag), 'industry')
        FROM unnest(industry_tags) AS tag
        WHERE trim(tag) != ''
      )
    )
    WHERE industry_tags IS NOT NULL AND array_length(industry_tags, 1) > 0;
  END IF;
END $$;

-- Update existing business model tags (only if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'business_model_tags') THEN
    UPDATE companies 
    SET business_model_tags = (
      SELECT ARRAY(
        SELECT DISTINCT normalize_tag(trim(tag), 'business_model')
        FROM unnest(business_model_tags) AS tag
        WHERE trim(tag) != ''
      )
    )
    WHERE business_model_tags IS NOT NULL AND array_length(business_model_tags, 1) > 0;
  END IF;
END $$;

-- Migrate keywords from business_model_tags to keywords column
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'business_model_tags') THEN
    -- First, extract potential keywords from business_model_tags and move them to keywords column
    UPDATE companies 
    SET keywords = (
      SELECT ARRAY(
        SELECT DISTINCT normalize_tag(trim(tag), 'keyword')
        FROM unnest(business_model_tags) AS tag
        WHERE trim(tag) != '' 
        AND normalize_tag(trim(tag), 'keyword') IN (
          SELECT enumlabel::text 
          FROM pg_enum 
          WHERE enumtypid = 'keyword_tag'::regtype
        )
      )
    )
    WHERE business_model_tags IS NOT NULL AND array_length(business_model_tags, 1) > 0;
    
    -- Then remove those keywords from business_model_tags
    UPDATE companies 
    SET business_model_tags = (
      SELECT ARRAY(
        SELECT DISTINCT tag
        FROM unnest(business_model_tags) AS tag
        WHERE tag NOT IN (
          SELECT enumlabel::text 
          FROM pg_enum 
          WHERE enumtypid = 'keyword_tag'::regtype
        )
      )
    )
    WHERE business_model_tags IS NOT NULL AND array_length(business_model_tags, 1) > 0;
  END IF;
END $$;

-- Clean up empty arrays
UPDATE companies SET industry_tags = NULL WHERE industry_tags = '{}';
UPDATE companies SET business_model_tags = NULL WHERE business_model_tags = '{}';
UPDATE companies SET keywords = NULL WHERE keywords = '{}';

-- Now filter out any tags that still don't match our enum
-- This creates a report of unmapped tags before filtering
CREATE TEMP TABLE unmapped_tags AS
SELECT DISTINCT 
  'industry' as tag_type,
  unnest(industry_tags) as tag_name
FROM companies 
WHERE industry_tags IS NOT NULL
  AND NOT validate_industry_tags(industry_tags)
UNION ALL
SELECT DISTINCT 
  'business_model' as tag_type,
  unnest(business_model_tags) as tag_name
FROM companies 
WHERE business_model_tags IS NOT NULL
  AND NOT validate_business_model_tags(business_model_tags)
UNION ALL
SELECT DISTINCT 
  'keyword' as tag_type,
  unnest(keywords) as tag_name
FROM companies 
WHERE keywords IS NOT NULL
  AND NOT validate_keywords(keywords);

-- Log unmapped tags (these will need manual review)
DO $$
DECLARE
  unmapped_count integer;
BEGIN
  SELECT COUNT(*) INTO unmapped_count FROM unmapped_tags;
  IF unmapped_count > 0 THEN
    RAISE NOTICE 'Found % unmapped tags that need manual review:', unmapped_count;
    RAISE NOTICE 'Check the unmapped_tags table for details';
  END IF;
END $$;

-- Filter out invalid tags from industry_tags
UPDATE companies 
SET industry_tags = (
  SELECT ARRAY(
    SELECT tag
    FROM unnest(industry_tags) AS tag
    WHERE tag IN (
      SELECT enumlabel::text 
      FROM pg_enum 
      WHERE enumtypid = 'industry_tag'::regtype
    )
  )
)
WHERE industry_tags IS NOT NULL AND NOT validate_industry_tags(industry_tags);

-- Filter out invalid tags from business_model_tags
UPDATE companies 
SET business_model_tags = (
  SELECT ARRAY(
    SELECT tag
    FROM unnest(business_model_tags) AS tag
    WHERE tag IN (
      SELECT enumlabel::text 
      FROM pg_enum 
      WHERE enumtypid = 'business_model_tag'::regtype
    )
  )
)
WHERE business_model_tags IS NOT NULL AND NOT validate_business_model_tags(business_model_tags);

-- Filter out invalid tags from keywords
UPDATE companies 
SET keywords = (
  SELECT ARRAY(
    SELECT tag
    FROM unnest(keywords) AS tag
    WHERE tag IN (
      SELECT enumlabel::text 
      FROM pg_enum 
      WHERE enumtypid = 'keyword_tag'::regtype
    )
  )
)
WHERE keywords IS NOT NULL AND NOT validate_keywords(keywords);

-- Clean up empty arrays again
UPDATE companies SET industry_tags = NULL WHERE industry_tags = '{}';
UPDATE companies SET business_model_tags = NULL WHERE business_model_tags = '{}';
UPDATE companies SET keywords = NULL WHERE keywords = '{}';

-- Re-enable constraints only if validation functions exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_industry_tags') THEN
    ALTER TABLE companies 
    ADD CONSTRAINT chk_industry_tags_valid 
    CHECK (validate_industry_tags(industry_tags));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_business_model_tags') THEN
    ALTER TABLE companies 
    ADD CONSTRAINT chk_business_model_tags_valid 
    CHECK (validate_business_model_tags(business_model_tags));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_keywords') THEN
    ALTER TABLE companies 
    ADD CONSTRAINT chk_keywords_valid 
    CHECK (validate_keywords(keywords));
  END IF;
END $$;

-- Clean up temporary functions
DROP FUNCTION normalize_tag(text, text);
DROP TABLE tag_mapping;

-- Keep unmapped_tags table for manual review
COMMENT ON TABLE unmapped_tags IS 'Tags that could not be automatically mapped to standardized enums - requires manual review';

-- Create a final summary
DO $$
DECLARE
  total_companies integer;
  companies_with_industry_tags integer;
  companies_with_business_model_tags integer;
  companies_with_keywords integer;
  total_industry_tags integer;
  total_business_model_tags integer;
  total_keywords integer;
  unmapped_count integer;
BEGIN
  SELECT COUNT(*) INTO total_companies FROM companies;
  SELECT COUNT(*) INTO companies_with_industry_tags FROM companies WHERE industry_tags IS NOT NULL;
  SELECT COUNT(*) INTO companies_with_business_model_tags FROM companies WHERE business_model_tags IS NOT NULL;
  SELECT COUNT(*) INTO companies_with_keywords FROM companies WHERE keywords IS NOT NULL;
  SELECT COUNT(*) INTO total_industry_tags FROM companies, unnest(industry_tags) WHERE industry_tags IS NOT NULL;
  SELECT COUNT(*) INTO total_business_model_tags FROM companies, unnest(business_model_tags) WHERE business_model_tags IS NOT NULL;
  SELECT COUNT(*) INTO total_keywords FROM companies, unnest(keywords) WHERE keywords IS NOT NULL;
  SELECT COUNT(*) INTO unmapped_count FROM unmapped_tags;
  
  RAISE NOTICE 'Tag migration summary:';
  RAISE NOTICE '- Total companies: %', total_companies;
  RAISE NOTICE '- Companies with industry tags: %', companies_with_industry_tags;
  RAISE NOTICE '- Companies with business model tags: %', companies_with_business_model_tags;
  RAISE NOTICE '- Companies with keywords: %', companies_with_keywords;
  RAISE NOTICE '- Total industry tags: %', total_industry_tags;
  RAISE NOTICE '- Total business model tags: %', total_business_model_tags;
  RAISE NOTICE '- Total keywords: %', total_keywords;
  RAISE NOTICE '- Unmapped tags requiring review: %', unmapped_count;
END $$; 