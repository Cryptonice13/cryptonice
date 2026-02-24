
-- Make wallet_address nullable on all 4 tables
ALTER TABLE user_portfolio ALTER COLUMN wallet_address DROP NOT NULL;
ALTER TABLE user_watchlist ALTER COLUMN wallet_address DROP NOT NULL;
ALTER TABLE portfolio_transactions ALTER COLUMN wallet_address DROP NOT NULL;
ALTER TABLE alert_history ALTER COLUMN wallet_address DROP NOT NULL;
