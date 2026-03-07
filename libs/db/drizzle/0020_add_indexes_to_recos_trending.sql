-- Custom SQL migration file, put your code below! --
CREATE UNIQUE INDEX IF NOT EXISTS idx_recos_trending_unique 
ON "recos_trending" ("media_id", "type");

CREATE INDEX idx_recos_trending_recommendation_count_media_id ON recos_trending (recommendation_count, media_id);